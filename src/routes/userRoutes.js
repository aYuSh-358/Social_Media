const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { body } = require('express-validator');
const validator = require('../validation')
const { validationResult } = require("express-validator");
const verifyToken = require('../middleware/authMiddleware')


router.post('/createUser', verifyToken, validator.validator('createUser'), userController.createUser);
router.get('/getAllUsers', verifyToken, userController.getAllUsers);
router.get('/getUserById/:id', verifyToken, userController.getUserById);
router.put('/updateUser/:id', verifyToken, validator.validator('updateUser'), userController.updateUser);
router.delete('/deleteUser/:id', verifyToken, userController.deleteUser);


module.exports = router;
