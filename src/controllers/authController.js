const { validationResult } = require("express-validator");
const User = require("../models/authModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { sendEmail } = require("./sendEmailController");
require("dotenv").config();

//Register API
/**
 * @swagger
 * /auth/registerUser:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and sends a welcome email. Accepts user details and a profile photo.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - userEmail
 *               - userPassword
 *               - userDOB
 *               - userMobileNo
 *               - userAddress
 *               - userProfilePhoto
 *             properties:
 *               userName:
 *                 type: string
 *                 example: John Doe
 *               userEmail:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               userPassword:
 *                 type: string
 *                 format: password
 *                 example: myStrongPassword123
 *               userDOB:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-01
 *               userMobileNo:
 *                 type: string
 *                 example: "9876543210"
 *               userAddress:
 *                 type: string
 *                 example: 123, Baker Street, London
 *               userProfilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *       400:
 *         description: Bad request (validation errors or user already exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *       500:
 *         description: Internal server error
 */

exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const {
      userName,
      userEmail,
      userPassword,
      userDOB,
      userMobileNo,
      userAddress,
    } = req.body;
    const userProfilePhoto = req.file;

    const existingUser = await User.findOne({ userEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
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
      userProfilePhoto: userProfilePhoto.filename,
    });

    // console.log(user);

    await user.save();
    sendEmail(user);
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.log(error);

    res.status(500).json({ Status: "500", error: error.message });
  }
};

/**
 * @swagger
 * /auth/getAllRegisterUsers:
 *   get:
 *     summary: Get all registered users
 *     description: Retrieves a list of all users stored in the database.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error fetching users
 *                 error:
 *                   type: object
 */

exports.getAllRegisterUsers = async (req, res) => {
  try {
    const users = await User.find().select(
      "userName userEmail userProfilePhoto"
    );
    // console.log(users);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

/**
 * @swagger
 * /auth/getRegisterUserById/{id}:
 *   get:
 *     summary: Get a registered user by ID
 *     description: Retrieves a user from the database by their unique ID.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The user ID
 *         schema:
 *           type: string
 *           example: 60dbf9d3d1fd5c0015f6b2e0
 *     responses:
 *       200:
 *         description: A user object
 *         content:
 *           application/json:
 *
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error fetching user
 *                 error:
 *                   type: object
 */
exports.getRegisterUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "userName userEmail userProfilePhoto"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
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

/**
 * @swagger
 * /auth/updateRegisterUser/{id}:
 *   put:
 *     summary: Update a registered user by ID
 *     description: Updates a user's information, including password and profile photo if provided.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user to update
 *         schema:
 *           type: string
 *           example: 60dbf9d3d1fd5c0015f6b2e0
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *                 example: Jane Doe
 *               userEmail:
 *                 type: string
 *                 format: email
 *                 example: jane.doe@example.com
 *               userPassword:
 *                 type: string
 *                 format: password
 *                 example: newSecurePassword123
 *               userDOB:
 *                 type: string
 *                 format: date
 *                 example: 1992-08-15
 *               userMobileNo:
 *                 type: string
 *                 example: "9123456789"
 *               userAddress:
 *                 type: string
 *                 example: 456, Park Lane, NYC
 *               userProfilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *       500:
 *         description: Server error while updating user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error updating user
 *                 error:
 *                   type: string
 */

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

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });

    // console.log(updatedUser);
  } catch (error) {
    // console.error(error);
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
};

/**
 * @swagger
 * /auth/deleteRegisterUser/{id}:
 *   delete:
 *     summary: Delete a registered user by ID
 *     description: Deletes a user from the database using their unique ID.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to delete
 *         schema:
 *           type: string
 *           example: 60dbf9d3d1fd5c0015f6b2e0
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Error deleting user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error deleting user
 *                 error:
 *                   type: string
 */

exports.deleteRegisterUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
};

/**
 * @swagger
 * /auth/loginUser:
 *   post:
 *     summary: Login a user
 *     description: Authenticates a user with email and password. Returns a JWT token upon successful login.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userEmail
 *               - userPassword
 *             properties:
 *               userEmail:
 *                 type: string
 *                 format: email
 *                 example: jane.doe@example.com
 *               userPassword:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid credentials or user not found
 *         content:
 *           application/json:
 *       500:
 *         description: Server error during login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Server error
 */

// exports.loginUser = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   try {
//     const { userEmail, userPassword } = req.body;

//     const existingUser = await User.findOne({ userEmail });
//     if (!existingUser) {
//       return res.status(400).json({ message: "User not found" });
//     }

//     const isMatch = await bcrypt.compare(
//       userPassword,
//       existingUser.userPassword
//     );
//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // Token expire session
//     const token = jwt.sign(
//       { userId: existingUser._id },
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRE }
//     );
//     res
//       .status(200)
//       .json({ message: "Login successful", user: existingUser, token });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userEmail, userPassword } = req.body;

    const existingUser = await User.findOne({ userEmail }).select(
      "userName userEmail userProfilePhoto"
    );

    if (!existingUser) {
      return res.status(400).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { userId: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(200).json({
      message: "Login successful",
      user: {
        userName: existingUser.userName,
        userEmail: existingUser.userEmail,
        userProfilePhoto: existingUser.userProfilePhoto,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
};
