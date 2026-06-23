const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    class: { type: String, required: true },
    text: { type: String, required: true },
    imageUrl: { type: String }, // optional image field
    options: [{ type: String, required: true }],
    correct: { type: Number, required: true }   // index of correct option
});

module.exports = mongoose.model('Question', questionSchema);