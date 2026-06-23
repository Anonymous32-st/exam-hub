const express = require('express');
const { protect } = require('../middleware/auth');   // Removed strict authorize for now
const DailyExam = require('../models/DailyExam');
const Question = require('../models/Question');
const Result = require('../models/Result');
const Setting = require('../models/Setting');
const TeacherNote = require('../models/TeacherNote');
const StudentNote = require('../models/StudentNote');
const TheoryQuestion = require('../models/TheoryQuestion');
const TheoryResult = require('../models/TheoryResult');

const router = express.Router();

// Protect all student routes with authentication only
router.use(protect);

// Get today's exam (OBJ)
router.get('/today-exam', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const exams = await DailyExam.find({ date: today, class: req.user.class });

        // Find OBJ results
        const resultsToday = await Result.find({ studentId: req.user.id, date: today });
        const takenSubjects = resultsToday.map(r => r.subject);

        const availableExams = exams.filter(e => !takenSubjects.includes(e.subject));
        res.json(availableExams);
    } catch (err) {
        console.error("today-exam error:", err);
        res.status(500).json({ msg: "Server error" });
    }
});

// Get today's exam (Theory)
router.get('/today-theory-exam', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const exams = await DailyExam.find({ date: today, class: req.user.class });

        // Find Theory results
        const theoryResultsToday = await TheoryResult.find({ studentId: req.user.id, date: today });
        const takenSubjects = theoryResultsToday.map(r => r.subject);

        const availableExams = exams.filter(e => !takenSubjects.includes(e.subject));
        res.json(availableExams);
    } catch (err) {
        console.error("today-theory-exam error:", err);
        res.status(500).json({ msg: "Server error" });
    }
});

// FIXED: Get questions for a subject & class
router.get('/questions/:subject/:class', async (req, res) => {
    try {
        const subject = req.params.subject.trim();
        const studentClass = req.params.class.trim();

        console.log(`Loading questions for subject: "${subject}", class: "${studentClass}"`);

        // Check if already taken today
        const existingResult = await Result.findOne({
            studentId: req.user.id,
            date: new Date().toISOString().split('T')[0],
            subject: subject
        });

        if (existingResult) {
            return res.status(403).json({ msg: "You have already taken this assessment today." });
        }

        const questions = await Question.find({
            subject: subject,
            class: studentClass
        }).lean();   // .lean() makes it faster and cleaner

        console.log(`Found ${questions.length} questions`);

        res.json(questions);
    } catch (err) {
        console.error("questions route error:", err);
        res.status(500).json({ msg: "Error loading questions" });
    }
});

// Submit exam
router.post('/submit-exam', async (req, res) => {
    try {
        const { date, subject, answers, totalQuestions } = req.body;

        const questions = await Question.find({ 
            subject: subject.trim(), 
            class: req.user.class 
        });

        // Check if already taken today
        const existingResult = await Result.findOne({
            studentId: req.user.id,
            date: date,
            subject: subject.trim()
        });

        if (existingResult) {
            return res.status(400).json({ msg: "You have already submitted this exam." });
        }

        let score = 0;
        questions.forEach((q, index) => {
            if (answers[index] === q.correct) score++;
        });

        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

        const result = await Result.create({
            studentId: req.user.id,
            date,
            subject,
            score: percentage,
            answers,
            totalQuestions
        });

        res.json({ score: percentage, result });
    } catch (err) {
        console.error("submit-exam error:", err);
        res.status(500).json({ msg: "Submit failed" });
    }
});

// Get my results
router.get('/my-results', async (req, res) => {
    try {
        const results = await Result.find({ studentId: req.user.id }).sort({ date: -1 });
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Error loading results" });
    }
});

// Get Setting
router.get('/settings/:key', async (req, res) => {
    try {
        const setting = await Setting.findOne({ key: req.params.key });
        res.json({ value: setting ? setting.value : null });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
});

// Get teacher notes for the student's class
router.get('/notes/class', async (req, res) => {
    try {
        const notes = await TeacherNote.find({ classLevel: req.user.class }).sort({ uploadedAt: -1 }).populate('teacherId', 'name subject');
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch class notes" });
    }
});

// Get personal notes
router.get('/notes/personal', async (req, res) => {
    try {
        const notes = await StudentNote.find({ studentId: req.user.id }).sort({ updatedAt: -1 });
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch personal notes" });
    }
});

// Create personal note
router.post('/notes/personal', async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) return res.status(400).json({ msg: "Title and content are required" });

        const note = await StudentNote.create({
            studentId: req.user.id,
            title,
            content
        });
        res.status(201).json({ msg: "Note created successfully", note });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to create note" });
    }
});

// Update personal note
router.put('/notes/personal/:id', async (req, res) => {
    try {
        const { title, content } = req.body;
        const note = await StudentNote.findOneAndUpdate(
            { _id: req.params.id, studentId: req.user.id },
            { title, content, updatedAt: Date.now() },
            { new: true }
        );
        if (!note) return res.status(404).json({ msg: "Note not found" });
        res.json({ msg: "Note updated successfully", note });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to update note" });
    }
});

// Delete personal note
router.delete('/notes/personal/:id', async (req, res) => {
    try {
        const note = await StudentNote.findOneAndDelete({ _id: req.params.id, studentId: req.user.id });
        if (!note) return res.status(404).json({ msg: "Note not found" });
        res.json({ msg: "Note deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to delete note" });
    }
});

// Get practice subjects
router.get('/practice-subjects', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if exam is ongoing
        const exams = await DailyExam.find({ date: today, class: req.user.class });
        const resultsToday = await Result.find({ studentId: req.user.id, date: today });
        const takenSubjects = resultsToday.map(r => r.subject);
        
        const pendingExams = exams.filter(e => !takenSubjects.includes(e.subject));
        
        if (pendingExams.length > 0) {
            return res.json({ locked: true, msg: "Practice is locked while you have pending scheduled assessments today." });
        }
        
        // If no pending exams, fetch available subjects for practice
        const subjects = await Question.distinct('subject', { class: req.user.class });
        res.json({ locked: false, subjects });
    } catch (err) {
        console.error("practice-subjects error:", err);
        res.status(500).json({ msg: "Server error" });
    }
});

// Get practice questions
router.get('/practice-questions/:subject', async (req, res) => {
    try {
        const subject = req.params.subject.trim();
        const today = new Date().toISOString().split('T')[0];
        
        // Check lock again
        const exams = await DailyExam.find({ date: today, class: req.user.class });
        const resultsToday = await Result.find({ studentId: req.user.id, date: today });
        const takenSubjects = resultsToday.map(r => r.subject);
        const pendingExams = exams.filter(e => !takenSubjects.includes(e.subject));
        
        if (pendingExams.length > 0) {
            return res.status(403).json({ msg: "Practice is locked while you have pending scheduled assessments today." });
        }
        
        const questions = await Question.find({ subject, class: req.user.class }).lean();
        res.json(questions);
    } catch (err) {
        console.error("practice-questions error:", err);
        res.status(500).json({ msg: "Server error" });
    }
});

// Submit practice
router.post('/submit-practice', async (req, res) => {
    try {
        const { subject, answers, totalQuestions } = req.body;
        const questions = await Question.find({ subject: subject.trim(), class: req.user.class });
        
        let score = 0;
        questions.forEach((q, index) => {
            if (answers[index] === q.correct) score++;
        });
        
        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
        res.json({ score: percentage });
    } catch (err) {
        console.error("submit-practice error:", err);
        res.status(500).json({ msg: "Submit failed" });
    }
});

// ================= THEORY ROUTES =================

// Get theory questions for a subject & class
router.get('/theory-questions/:subject/:class', async (req, res) => {
    try {
        const subject = req.params.subject.trim();
        const studentClass = req.params.class.trim();

        // Check if already taken today
        const existingResult = await TheoryResult.findOne({
            studentId: req.user.id,
            date: new Date().toISOString().split('T')[0],
            subject: subject
        });

        if (existingResult) {
            return res.status(403).json({ msg: "You have already submitted the theory exam for this subject today." });
        }

        const questions = await TheoryQuestion.find({
            subject: subject,
            class: studentClass
        }).lean();

        res.json(questions);
    } catch (err) {
        console.error("theory questions route error:", err);
        res.status(500).json({ msg: "Error loading theory questions" });
    }
});

// Submit theory exam
router.post('/submit-theory', async (req, res) => {
    try {
        const { date, subject, answers } = req.body;

        const existingResult = await TheoryResult.findOne({
            studentId: req.user.id,
            date: date,
            subject: subject.trim()
        });

        if (existingResult) {
            return res.status(400).json({ msg: "You have already submitted this theory exam." });
        }

        const result = await TheoryResult.create({
            studentId: req.user.id,
            date,
            subject,
            answers,
            status: 'Ungraded'
        });

        res.json({ msg: "Theory exam submitted successfully!", result });
    } catch (err) {
        console.error("submit-theory error:", err);
        res.status(500).json({ msg: "Theory submit failed" });
    }
});

// Get my theory results
router.get('/my-theory-results', async (req, res) => {
    try {
        const results = await TheoryResult.find({ studentId: req.user.id }).sort({ date: -1 });
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Error loading theory results" });
    }
});

// Get student's grades (C.A + Exam scores with titles) - separate from exam results
router.get('/my-grades', async (req, res) => {
    try {
        const grades = await Result.find({
            studentId: req.user.id,
            $or: [
                { caScore: { $ne: null } },
                { examScore: { $ne: null } }
            ]
        })
        .populate('gradedBy', 'name subject')
        .sort({ gradeDate: -1 });

        res.json(grades);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to load grades" });
    }
});

module.exports = router;