const express = require('express')
const app = express();
const mongoose = require('mongoose');
const db = require("./db");
app.use(express.json());
require('dotenv').config();

app.get('/', function (req,res){
    res.send(" Welcome to Online Book Stores! ")
})


const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes')
const orderRoutes = require('./routes/orderRoutes')

app.use('/user', userRoutes); 
app.use('/books', bookRoutes);
app.use('/orders', orderRoutes);

app.use('/uploads', express.static('uploads'));


app.listen(3000, () => {
    console.log('listing on port in 3000');
  });