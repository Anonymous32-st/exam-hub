const mongoose = require('mongoose');

const theoryResultSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    subject: { type: String, required: true },
    answers: { type: Object }, // { questionId: "student's answer HTML/text" }
    status: { type: String, enum: ['Ungraded', 'Graded'], default: 'Ungraded' },
    score: { type: Number, default: null }, // Total score assigned by teacher
    feedback: { type: String, default: "" } // Optional feedback from teacher
}, { timestamps: true });

module.exports = mongoose.model('TheoryResult', theoryResultSchema);
