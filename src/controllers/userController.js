const mongoose = require('mongoose');
const User = require('../models/userModel');
const { validationResult } = require('express-validator');

exports.createUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { userName, userEmail, userPassword, userDOB, userMobileNo, userAddress } = req.body;
        const existingEmail = await User.findOne({ userEmail });
        console.log(existingEmail);

        if (existingEmail) {

            return res.status(400).json({ message: 'User Email already exist' });
        } else {

            const user = new User({ userName, userEmail, userPassword, userDOB, userMobileNo, userAddress });
            await user.save();
            res.status(201).json({ message: 'User created successfully', user });
        }
    } catch (error) {
        console.log(error);

        res.status(500).json({ message: 'Error creating user', error });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

exports.getUserById = async (req, res) => {
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

exports.updateUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
    }
};


exports.deleteUser = async (req, res) => {
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


