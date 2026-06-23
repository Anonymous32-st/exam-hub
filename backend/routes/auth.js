const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign(
            { 
                id: user._id, 
                role: user.role, 
                name: user.name, 
                class: user.class, 
                subject: user.subject 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                role: user.role, 
                class: user.class,
                subject: user.subject 
            } 
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Register (Admin only - protected in admin route)
router.post('/register', async (req, res) => {
    const { name, username, password, role, class: userClass, subject } = req.body;

    try {
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({ name, username, password, role, class: userClass, subject });
        await user.save();

        res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;