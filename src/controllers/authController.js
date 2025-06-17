const { validationResult } = require('express-validator');
const User = require("../models/authModels");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

//Register API

exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { userName, userEmail, userPassword, userDOB, userMobileNo, userAddress } = req.body;
        const userProfilePhoto = req.file;

        const existingUser = await User.findOne({ userEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(userPassword, 10);
        //console.log(userProfilePhoto);

        const user = new User({
            userName,
            userEmail,
            userPassword: hashedPassword,
            userDOB,
            userMobileNo,
            userAddress,
            userProfilePhoto: userProfilePhoto.filename
        });

        console.log(user);


        await user.save();
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        console.log(error);

        res.status(500).json({ Status: '500', error: error.message });
    }
};
exports.getAllRegisterUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

exports.getRegisterUserById = async (req, res) => {
    try {

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error });
    }
};

// exports.updateRegisterUser = async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//     }
//     try {
//         const updateRegisterUser = await User.findByIdAndUpdate(req.params.id, req.body, req.file, { new: true });
//         console.log(updateRegisterUser);
//         if (!updateRegisterUser) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         res.status(200).json({ message: 'User updated successfully', user: updateRegisterUser });


//     } catch (error) {
//         res.status(500).json({ message: 'Error updating user', error });
//     }
// };


exports.updateRegisterUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const updateData = { ...req.body };

        if (updateData.userPassword) {
            updateData.userPassword = await bcrypt.hash(updateData.userPassword, 10);
        }

        if (req.file) {
            updateData.userProfilePhoto = req.file.filename;
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User updated successfully', user: updatedUser });

        console.log(updatedUser);


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

exports.deleteRegisterUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
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

