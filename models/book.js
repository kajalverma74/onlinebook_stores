const mongoose = require('mongoose');
const BookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
      },
    author: String,
    price: Number,
    description: String,
    image: String, 
    stock: Number,
    rating: Number,
});


const Book = mongoose.model('Book', BookSchema);

module.exports = Book ;