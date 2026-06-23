const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    subject: { type: String, required: true },
    score: { type: Number },                       // Exam score (from auto-graded exams)
    answers: { type: Object },                    // { questionIndex: selectedOption }
    totalQuestions: { type: Number },
    // New grading fields
    caScore: { type: Number, default: null },     // Continuous Assessment score (0-100)
    examScore: { type: Number, default: null },   // Final Exam score (0-100)
    average: { type: Number, default: null },     // Calculated average of CA and exam
    title: { type: String, default: null },       // e.g., "First Term", "Mid Term", "Second Term"
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Teacher who added the grades
    gradeDate: { type: Date, default: null }      // When the grade was entered
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);