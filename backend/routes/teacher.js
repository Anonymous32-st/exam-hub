const fs = require('fs');
const path = require('path');
const multer = require('multer');
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Question = require('../models/Question');
const Result = require('../models/Result');
const User = require('../models/User');
const TeacherNote = require('../models/TeacherNote');
const TheoryQuestion = require('../models/TheoryQuestion');
const TheoryResult = require('../models/TheoryResult');
const router = express.Router();

// Setup Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

router.use(protect, authorize('teacher'));

// Middleware to resolve teacher's active subject and active class.
router.use((req, res, next) => {
    if (req.user && req.user.role === 'teacher') {
        // Resolve subject
        const subjects = req.user.subject ? req.user.subject.split(',').map(s => s.trim()) : [];
        if (subjects.length > 0) {
            let activeSubject = req.header('X-Active-Subject') || req.query.subject || req.body.subject;
            if (activeSubject) {
                activeSubject = activeSubject.trim();
                const matchedSubject = subjects.find(s => s.toLowerCase() === activeSubject.toLowerCase());
                if (matchedSubject) {
                    req.user.subject = matchedSubject;
                } else {
                    req.user.subject = subjects[0];
                }
            } else {
                req.user.subject = subjects[0];
            }
        }

        // Resolve class
        const classes = req.user.class ? req.user.class.split(',').map(c => c.trim()) : [];
        if (classes.length > 0) {
            let activeClass = req.header('X-Active-Class') || req.query.class || req.body.class;
            if (activeClass) {
                activeClass = activeClass.trim();
                const matchedClass = classes.find(c => c.toLowerCase() === activeClass.toLowerCase());
                if (matchedClass) {
                    req.user.class = matchedClass;
                } else {
                    req.user.class = classes[0];
                }
            } else {
                req.user.class = classes[0];
            }
        }
    }
    next();
});



router.post('/questions', async (req, res) => {
    try {
        const question = await Question.create({
            subject: req.user.subject ? req.user.subject.trim() : req.user.subject,
            class: req.body.class ? req.body.class.trim() : req.body.class,
            text: req.body.text,
            imageUrl: req.body.imageUrl || null,
            options: req.body.options,
            correct: req.body.correct
        });
        res.status(201).json({ msg: "Question added successfully", question });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// View class results for teacher
router.get('/results', async (req, res) => {
    try {
        const targetClass = req.query.class || req.user.class;

        // Fetch results for the teacher's subject only
        const results = await Result.find({ subject: req.user.subject })
            .populate('studentId', 'name class')
            .sort({ date: -1 });

        // Filter by the student's class
        const filteredResults = results.filter(r => r.studentId && r.studentId.class === targetClass);

        res.json(filteredResults);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to load results" });
    }
});

// Reset a specific student's exam
router.post('/reset-student-exam', async (req, res) => {
    try {
        const { username, date } = req.body;
        
        if (!username) {
            return res.status(400).json({ msg: "Student username is required" });
        }

        // Find the student
        const student = await User.findOne({ username: new RegExp(`^${username.trim()}$`, 'i'), role: 'student' });
        
        if (!student) {
            return res.status(404).json({ msg: "Student not found" });
        }

        // Only allow resetting for the teacher's specific subject
        const filter = {
            studentId: student._id,
            subject: req.user.subject
        };

        if (date) {
            filter.date = date;
        }

        const deleted = await Result.deleteMany(filter);
        
        if (deleted.deletedCount === 0) {
            return res.status(404).json({ msg: "No exam results found for this student to reset." });
        }

        res.json({ msg: "Student's exam has been successfully reset!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to reset exam" });
    }
});

// Update allocated time for an active exam
router.post('/update-duration', async (req, res) => {
    try {
        const { date, class: examClass, duration } = req.body;
        
        if (!date || !examClass || !duration) {
            return res.status(400).json({ msg: "Please provide date, class, and new duration" });
        }

        const exam = await require('../models/DailyExam').findOneAndUpdate(
            { date, class: examClass.trim(), subject: req.user.subject },
            { duration: Number(duration) },
            { new: true }
        );

        if (!exam) {
            return res.status(404).json({ msg: "No pushed exam found for this subject, class, and date." });
        }

        res.json({ msg: "Allocated time successfully updated!", duration: exam.duration });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to update duration" });
    }
});

// Upload a note
router.post('/notes/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "Please select a file to upload" });
        }

        const { title, class: targetClass } = req.body;
        if (!title || !targetClass) {
            return res.status(400).json({ msg: "Please provide title and class" });
        }

        const note = await TeacherNote.create({
            title,
            subject: req.user.subject,
            classLevel: targetClass.trim(),
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            teacherId: req.user.id
        });

        res.status(201).json({ msg: "Note uploaded successfully", note });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to upload note" });
    }
});

// Fetch uploaded notes by the teacher
router.get('/notes', async (req, res) => {
    try {
        const notes = await TeacherNote.find({ teacherId: req.user.id }).sort({ uploadedAt: -1 });
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch notes" });
    }
});

// Delete a note
router.delete('/notes/:id', async (req, res) => {
    try {
        const note = await TeacherNote.findOne({ _id: req.params.id, teacherId: req.user.id });
        if (!note) {
            return res.status(404).json({ msg: "Note not found" });
        }

        const filePath = path.join(__dirname, '..', note.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await note.deleteOne();
        res.json({ msg: "Note deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to delete note" });
    }
});

// ================= THEORY EXAM ROUTES =================

// Add a theory question
router.post('/theory-questions', async (req, res) => {
    try {
        const question = await TheoryQuestion.create({
            subject: req.user.subject ? req.user.subject.trim() : req.user.subject,
            class: req.body.class ? req.body.class.trim() : req.body.class,
            text: req.body.text,
            imageUrl: req.body.imageUrl || null
        });
        res.status(201).json({ msg: "Theory question added successfully", question });
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// View theory submissions for grading
router.get('/theory-answers', async (req, res) => {
    try {
        const targetClass = req.query.class || req.user.class;
        
        const results = await TheoryResult.find({ subject: req.user.subject })
            .populate('studentId', 'name class username')
            .sort({ date: -1 });

        const filteredResults = results.filter(r => r.studentId && r.studentId.class === targetClass);

        res.json(filteredResults);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to load theory answers" });
    }
});

// Grade a theory submission
router.post('/theory-answers/grade', async (req, res) => {
    try {
        const { resultId, score, feedback } = req.body;
        if (!resultId || score === undefined) {
            return res.status(400).json({ msg: "Result ID and score are required" });
        }

        const theoryResult = await TheoryResult.findOne({ _id: resultId, subject: req.user.subject });
        if (!theoryResult) {
            return res.status(404).json({ msg: "Theory result not found" });
        }

        theoryResult.score = Number(score);
        theoryResult.feedback = feedback || "";
        theoryResult.status = 'Graded';
        await theoryResult.save();

        res.json({ msg: "Theory exam graded successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to grade theory exam" });
    }
});

// ================= GRADING PLATFORM ROUTES =================

// Add or update student grade (C.A + Exam + Title)
router.post('/grades', async (req, res) => {
    try {
        const { studentId, caScore, examScore, title } = req.body;
        
        if (!studentId || caScore === undefined || examScore === undefined || !title) {
            return res.status(400).json({ msg: "Student ID, C.A score, exam score, and title are required" });
        }

        // Validate scores are 0-100
        if (caScore < 0 || caScore > 100 || examScore < 0 || examScore > 100) {
            return res.status(400).json({ msg: "Scores must be between 0 and 100" });
        }

        // Calculate average
        const average = (Number(caScore) + Number(examScore)) / 2;

        // Check if student exists and is in teacher's subject
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ msg: "Student not found" });
        }

        // Find or create a result entry for this grading
        let result = await Result.findOne({
            studentId,
            subject: req.user.subject,
            title: title
        });

        if (result) {
            // Update existing
            result.caScore = Number(caScore);
            result.examScore = Number(examScore);
            result.average = average;
            result.gradedBy = req.user.id;
            result.gradeDate = new Date();
        } else {
            // Create new
            result = new Result({
                studentId,
                subject: req.user.subject,
                date: new Date().toISOString().split('T')[0],
                caScore: Number(caScore),
                examScore: Number(examScore),
                average,
                title,
                gradedBy: req.user.id,
                gradeDate: new Date()
            });
        }

        await result.save();
        res.json({ msg: "Grade saved successfully!", result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to save grade" });
    }
});

// Get all students in teacher's class for grading
router.get('/students-for-grading', async (req, res) => {
    try {
        const targetClass = req.query.class || req.user.class;
        
        const students = await User.find({
            role: 'student',
            class: targetClass
        }).select('_id name username class');

        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to load students" });
    }
});

// Get all grades for a student (by subject and teacher)
router.get('/student-grades/:studentId', async (req, res) => {
    try {
        const grades = await Result.find({
            studentId: req.params.studentId,
            subject: req.user.subject,
            $or: [
                { caScore: { $ne: null } },
                { examScore: { $ne: null } }
            ]
        }).sort({ gradeDate: -1 });

        res.json(grades);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to load student grades" });
    }
});

// Get all grades entered by this teacher (for the class)
router.get('/grades-list', async (req, res) => {
    try {
        const targetClass = req.query.class || req.user.class;
        
        const grades = await Result.find({
            subject: req.user.subject,
            $or: [
                { caScore: { $ne: null } },
                { examScore: { $ne: null } }
            ]
        })
        .populate('studentId', 'name class username')
        .sort({ gradeDate: -1 });

        // Filter by class
        const filteredGrades = grades.filter(g => g.studentId && g.studentId.class === targetClass);

        res.json(filteredGrades);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to load grades" });
    }
});

module.exports = router;