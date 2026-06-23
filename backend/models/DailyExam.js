const mongoose = require('mongoose');

const dailyExamSchema = new mongoose.Schema({
    date: { type: String, required: true },   // YYYY-MM-DD
    class: { type: String, required: true },
    subject: { type: String, required: true },
    pushedBy: { type: String },
    duration: { type: Number, default: 60 }   // Duration in minutes
});

module.exports = mongoose.model('DailyExam', dailyExamSchema);