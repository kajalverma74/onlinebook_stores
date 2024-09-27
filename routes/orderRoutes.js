const express = require('express')
const Order = require('./../models/order');
const Book = require('../models/book')
const User = require('./../models/user')
const DeletedBook = require('./../models/deletedBook');

const router = express.Router();

router.post('/', async (req, res) => {
    const { user, books } = req.body;
    let totalPrice = 0;
    const orderBooks = [];

    try {
        // Fetch user details
        const userData = await User.findById(user);
        if (!userData) return res.status(404).json({ message: `User with ID ${user} not found` });

        // Fetch books to calculate total price and collect author names
        for (const item of books) {
            const book = await Book.findById(item.book);
            if (!book) return res.status(404).json({ message: `Book with ID ${item.book} not found` });

            // console.log("Book fetched:", book);
            // console.log("Book price:", book.price);
            // console.log("Item quantity:", item.quantity);

            // add author name 
            orderBooks.push({
                book: book._id,
                title: book.title,
                author: book.author,
                price: book.price,
                quantity: item.quantity
            });

            totalPrice += book.price * item.quantity;
        }

        // Create a new order with user details
        const newOrder = new Order({
            user: {
                id: userData._id,
                name: userData.name
            },
            books: orderBooks,
            totalPrice,
            status: 'Pending',
            createdAt: new Date(),
        });
        console.log(newOrder);

        await newOrder.save();

        res.status(201).json({
            message: 'Order created successfully',
            order: newOrder
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Server error while creating order' });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        console.log(`Attempting to delete order with ID: ${orderId}`);

        // Find the order to delete
        const order = await Order.findById(orderId).populate('books.book');
        console.log('Fetched order:', order);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Get user data (assumes user ID is passed in req.body)
        const userData = req.body.user;

        if (!userData) {
            return res.status(400).json({ message: 'User data is required' });
        }

        // Fetch the user's name using the user ID
        const user = await User.findById(userData);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Move the order data to DeletedBook collection
        const deletedBook = new DeletedBook({
            user: user._id,
            userName: user.name, // Store the user's name
            books: order.books.map(item => ({
                book: item.book ? item.book._id : null,
                quantity: item.quantity
            })).filter(item => item.book !== null),
            totalPrice: order.totalPrice,
            status: 'deleted',
            orderDate: order.orderDate || Date.now(),
            title: order.books.map(item => item.book ? item.book.title : "").filter(Boolean),
            author: order.books.map(item => item.book ? item.book.author : "").filter(Boolean),
            price: order.books.reduce((acc, item) => acc + (item.book ? item.book.price * item.quantity : 0), 0),
            description: order.books.map(item => item.book ? item.book.description : "").filter(Boolean),
            stock: order.books.map(item => item.book ? item.book.stock : "").filter(Boolean),
            rating: order.books.map(item => item.book ? item.book.rating : "").filter(Boolean),
            image: order.books.map(item => item.book ? item.book.image : "").filter(Boolean)
        });

        await deletedBook.save();

        // Now delete the original order from the Order collection
        await Order.findByIdAndDelete(orderId);

        res.json({ message: 'Order deleted and moved to DeletedBooks collection', deletedBook });
    } catch (err) {
        console.error('Error deleting order:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});



router.post('/restore/:id', async (req, res) => {
    try {
        // Find the deleted book document
        const deletedBook = await DeletedBook.findById(req.params.id);
        if (!deletedBook) {
            console.log('Deleted book not found');
            return res.status(404).json({ message: 'Deleted book not found' });
        }

        console.log('Deleted book found:', deletedBook);

        // Fetch the user data based on the user ID in the deleted book
        const user = await User.findById(deletedBook.user);
        if (!user) {
            console.log('User associated with the deleted book not found');
            return res.status(404).json({ message: 'User associated with the deleted book not found' });
        }

        console.log('User found:', user);

        // Create a new order from the deleted book data, including userName
        const restoredOrder = new Order({
            user: {
                id:user._id,
                name:user.name
            },
        
            books: deletedBook.books
                .filter(item => item.book) 
                .map(item => ({ book: item.book, quantity: item.quantity })), 
            totalPrice: deletedBook.totalPrice,
            orderDate: deletedBook.orderDate || new Date(),
            status: 'active' 
        });

        await restoredOrder.save(); 
        console.log('Order restored:', restoredOrder);

        
        await DeletedBook.findByIdAndDelete(req.params.id);

    
        res.json({ message: 'Order restored successfully', restoredOrder });
    } catch (err) {
        console.error('Error restoring order:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});




module.exports = router;