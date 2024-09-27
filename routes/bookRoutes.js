const express = require('express');
const Book = require('./../models/book');
const DeletedBook = require('../models/deletedBook');
// const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const router = express.Router();
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Folder where files will be saved
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
    }
});

const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// GET a single book by ID
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: "Book not" });

        }
        res.json(book);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new book
router.post('/', upload.single('image'), async (req, res) => {
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        price: req.body.price,
        description: req.body.description,
        image: req.file.path, // Save the file path
        stock: req.body.stock,
        rating: req.body.rating,
    });

    try {
        const newBook = await book.save();
        res.status(200).json({
            message: 'Book image uploads successfully!',
            book: newBook
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});                     ////   http://localhost:3000/books //



router.put('/:id/image', upload.single('image'), async (req, res) => {
    const bookId = req.params.id.trim();

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
        return res.status(400).json({ message: 'Invalid book ID format.' });
    }

    const updates = {};

    if (req.body.title) updates.title = req.body.title.trim();
    if (req.body.author) updates.author = req.body.author.trim();
    if (req.body.price) updates.price = req.body.price;
    if (req.body.description) updates.description = req.body.description.trim();
    if (req.body.stock) updates.stock = req.body.stock;
    if (req.body.rating) updates.rating = req.body.rating;

    if (req.file) {
        updates.image = req.file.path;
    }

    try {
        const updatedBook = await Book.findByIdAndUpdate(
            bookId,
            updates,
            { new: true, runValidators: true } // Return the updated document
        );

        if (!updatedBook) {
            return res.status(404).json({ message: 'Book not found!' });
        }

        res.status(200).json({
            message: 'Book updated successfully!',
            book: updatedBook
        });
    } catch (err) {
        console.error(err);  
        res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
});
////   http://localhost:3000/books/66f3f76b2207534d018e3d94/image  //    



router.delete('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Move the book data to DeletedBook collection
        const deletedBook = new DeletedBook({
            user: req.body.user,
            books: [{ book: book._id, quantity: 1 }],
            totalPrice: book.price,
            orderDate: Date.now(),
            title: book.title,
            author: book.author,
            price: book.price,
            description: book.description,
            stock: book.stock,
            rating: book.rating,
            image: book.image
        });

        await deletedBook.save();

        // Now delete the original book from the Book collection
        await Book.findByIdAndDelete(req.params.id);

        res.json({ message: 'Book deleted and moved to DeletedBooks collection', deletedBook });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Restore a deleted book from DeletedBook to Book collection
router.post('/restore/:id', async (req, res) => {
    try {
        // Find the deleted book by ID
        const deletedBook = await DeletedBook.findById(req.params.id);
        if (!deletedBook) {
            return res.status(404).json({ message: 'Deleted book not found' });
        }

        // Restore book with type checking
        const restoreField = (field) => Array.isArray(field) ? field[0] : field;

        const restoredBook = new Book({
            title: restoreField(deletedBook.title),
            author: restoreField(deletedBook.author),
            price: restoreField(deletedBook.price),
            description: restoreField(deletedBook.description),
            stock: restoreField(deletedBook.stock),
            rating: restoreField(deletedBook.rating),
            image: restoreField(deletedBook.image)
        });

        // Save the restored book to the Book collection
        await restoredBook.save();

        // Delete the entry from the DeletedBook collection
        await DeletedBook.findByIdAndDelete(req.params.id);

        res.json({ message: 'Book restored successfully', restoredBook });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Export the router
module.exports = router;
