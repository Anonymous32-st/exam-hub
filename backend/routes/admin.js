const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Protect all admin routes (only admins allowed)
router.use(protect);
router.use(authorize('admin'));

function generateTempPassword(len = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!%*?';
    let pw = '';
    for (let i = 0; i < len; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
    return pw;
}
const User = require('../models/User');
const DailyExam = require('../models/DailyExam');
const Result = require('../models/Result');
const Setting = require('../models/Setting');

// Add User
router.post('/users', async (req, res) => {
    try {
        const { name, username, password, role, class: userClass, subject } = req.body;
        const newUser = new User({ name, username, password, role, class: userClass ? userClass.trim() : userClass, subject: role === 'teacher' && subject ? subject.trim() : undefined });
        await newUser.save();
        res.json({ msg: "User created successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
});

// Get Users (Manage Users)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
});

// Reset a user's password - accept optional manual password or auto-generate (admin-only)
router.post('/users/:id/reset-password', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        const newPassword = req.body.password && req.body.password.trim() ? req.body.password.trim() : generateTempPassword(10);
        user.password = newPassword; // will be hashed by pre-save hook
        await user.save();
        
        res.json({ password: newPassword });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Delete User
router.delete('/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: "User deleted" });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
});

// Push Exam (already working)
router.post('/push-exam', async (req, res) => {
    try {
        const { date, class: examClass, subject, duration } = req.body;
        const examSubject = subject ? subject.trim() : subject;
        const examClassName = examClass ? examClass.trim() : examClass;
        await DailyExam.deleteOne({ date, class: examClassName, subject: examSubject });
        const daily = new DailyExam({ date, class: examClassName, subject: examSubject, duration: duration ? Number(duration) : 60 });
        await daily.save();
        res.json({ msg: "Exam pushed successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Failed to push exam" });
    }
});

// RESET EXAM - Now added
router.post('/reset-exam', async (req, res) => {
    try {
        const { date, class: examClass, subject, username } = req.body;
        const filter = {};
        if (date) filter.date = date;
        if (examClass) filter.class = examClass.trim();
        if (subject) filter.subject = subject.trim();

        if (username) {
            const user = await User.findOne({ username: new RegExp(`^${username.trim()}$`, 'i'), role: 'student' });
            if (!user) {
                return res.status(404).json({ msg: "Student not found. Check the username." });
            }
            filter.studentId = user._id;
        }

        await Result.deleteMany(filter);
        res.json({ msg: "Exam reset successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Failed to reset exam" });
    }
});

// GENERAL RESULTS - Now added
router.get('/results', async (req, res) => {
    try {
        const results = await Result.find().populate('studentId', 'name class');
        res.json(results);
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
});

// GET Setting
router.get('/settings/:key', async (req, res) => {
    try {
        const setting = await Setting.findOne({ key: req.params.key });
        res.json({ value: setting ? setting.value : null });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
});

// UPDATE Setting
router.post('/settings/:key', async (req, res) => {
    try {
        await Setting.findOneAndUpdate(
            { key: req.params.key },
            { value: req.body.value },
            { upsert: true, new: true }
        );
        res.json({ msg: "Setting updated" });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;