const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

// Hash password before saving it to the database
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error); // Pass error to middleware for proper handling
    }
});

// Method to compare input password with hashed password
userSchema.methods.comparePassword = async function(candidatePassword){
    try{
    
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
        
    }catch(err){
        throw err;
    }
}

const User = mongoose.model('User', userSchema);

module.exports = User;
