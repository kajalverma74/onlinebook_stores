const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./../models/user');
const router = express.Router();
const { jwtAuthMiddleware, generateToken } = require('./../jwt');

// Signup Route

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({ name, email, password });

        // Save the user to the database
        const newUser = await user.save();

        console.log('User registered successfully:', newUser);

        const token = generateToken({ id: newUser._id });

        const userWithoutPassword = {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email
        };

        res.status(201).json({
            message: 'Signup successful',
            user: userWithoutPassword,
            token: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error });
    }
});


// Signin Route

router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken({ id: user._id });

        // Send the token in the response
        res.json({
            message: 'Login successful',
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Password 
router.put('/update-password', jwtAuthMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
        }

        console.log('Decoded user ID from JWT:', req.user.id); // Add this to check if ID is available

        const user = await User.findById(req.user.id); // Fetch user by ID from JWT payload
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Compare current password with the one in DB
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid current password' });
        }

        // Hash the new password and save it
        user.password = newPassword; // This will be hashed by the pre-save hook
        await user.save();

        console.log('Password updated');
        res.status(200).json({
            message: 'Password updated successfully',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
