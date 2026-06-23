const mongoose = require('mongoose');

const teacherNoteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    classLevel: { type: String, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TeacherNote', teacherNoteSchema);
