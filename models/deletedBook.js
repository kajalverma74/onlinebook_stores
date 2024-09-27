const mongoose = require('mongoose');

const deletedBookSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    books: [{ book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' }, quantity: { type: Number, required: true } }],
    totalPrice: { type: Number, required: true },
    status: { type: String, default: 'deleted' },
    orderDate: { type: Date, required: true },
    title: [String],
    author: [String],
    price: { type: Number, required: true },
    description: [String],
    stock: [Number],
    rating: [Number],
    image: [String]
});

const DeletedBook = mongoose.model('DeletedBook', deletedBookSchema);

module.exports = DeletedBook;


// deletedBookSchema   http://localhost:3000/books/66f4081051689838a61a6dab
// {
//     "user": "user_id_here" // Provide user ID if necessary
// }
