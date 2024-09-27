const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String
    },
    books: [
        {
            book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },  /// author id
            title: String,
            author: String,
            price: Number,
            quantity: Number
        }
    ],
    totalPrice: Number,
    status: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);


// method post in orders
//     "user": "66f3e88f3c06229538d65d20",
//     "books": [
//      {
//          "book": "66f5097b80cbe87fcc719f17",
//          "quantity": 2
//      },
//      {
//          "book": "66f4081051689838a61a6dab", 
//          "quantity": 1
//      }
//  ]
// }


