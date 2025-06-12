const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const validator = require('../validation')
const { validationResult } = require("express-validator");


// Register Route
router.post('/registerUser', validator.validator('registerUser'), authController.registerUser);

// Login Route
router.post('/loginUser', validator.validator('loginUser'), authController.loginUser);

module.exports = router;
