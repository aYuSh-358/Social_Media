const { validationResult } = require('express-validator');
const User = require("../models/userModel");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

//Register API

exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { userName, userEmail, userPassword, userDOB, userMobileNo, userAddress } = req.body;

        const existingUser = await User.findOne({ userEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(userPassword, 10);

        const user = new User({
            userName,
            userEmail,
            userPassword: hashedPassword,
            userDOB,
            userMobileNo,
            userAddress
        });

        await user.save();
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


//Login API

exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { userEmail, userPassword } = req.body;

        const existingUser = await User.findOne({ userEmail });
        if (!existingUser) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(userPassword, existingUser.userPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }


        // Token expire session 
        const token = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
        res.status(200).json({ message: 'Login successful', user: existingUser, token });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

