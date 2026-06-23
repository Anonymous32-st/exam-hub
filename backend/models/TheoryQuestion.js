const mongoose = require('mongoose');

const theoryQuestionSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    class: { type: String, required: true },
    text: { type: String, required: true },
    imageUrl: { type: String } // optional image field
});

module.exports = mongoose.model('TheoryQuestion', theoryQuestionSchema);
