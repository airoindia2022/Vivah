const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const users = [
    {
        fullName: 'Admin User',
        email: 'admin@vivah.com',
        password: 'password123',
        gender: 'Other',
        age: 30,
        isAdmin: true,
        isVerified: true
    }
];

const importData = async () => {
    try {
        await User.create(users);
        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
