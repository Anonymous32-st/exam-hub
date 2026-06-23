// Vercel Serverless Entry Point
// This file exports the Express app for Vercel's serverless runtime.
// For local development, run: node server.js (which calls app.listen)

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const app = require('../app');

module.exports = app;
