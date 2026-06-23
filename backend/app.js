// app.js — Express app setup (shared by local dev server and Vercel serverless)
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');

const app = express();

// CORS — allow same-origin (Vercel) and localhost for local dev
const allowedOrigins = [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    /\.vercel\.app$/,  // any *.vercel.app subdomain
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (e.g. curl, mobile apps)
        if (!origin) return callback(null, true);
        const allowed = allowedOrigins.some((o) =>
            typeof o === 'string' ? o === origin : o.test(origin)
        );
        if (allowed) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json());

// Connect to MongoDB (lazy — won't throw on import, only when first request hits)
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

// Serve uploaded files (local dev only — on Vercel, uploads dir won't persist)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend (local dev only — on Vercel, static files are served via vercel.json routes)
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

module.exports = app;
