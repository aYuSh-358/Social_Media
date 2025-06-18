const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { body } = require("express-validator");
const validator = require("../validation");
const { validationResult } = require("express-validator");
const verifyToken = require("../middleware/authMiddleware");
const { upload } = require("../middleware/multerConfig");

// Register Route
router.post(
  "/registerUser",
  verifyToken,
  validator.validator("registerUser"),
  upload.single("userProfilePhoto"),
  authController.registerUser
);
router.get("/getAllRegisterUsers", authController.getAllRegisterUsers);
// router.get('/getAllRegisterUsers', verifyToken, authController.getAllRegisterUsers);
router.get(
  "/getRegisterUserById/:id",
  verifyToken,
  authController.getRegisterUserById
);
router.put(
  "/updateRegisterUser/:id",
  verifyToken,
  validator.validator("registerUser"),
  upload.single("userProfilePhoto"),
  authController.updateRegisterUser
);
router.delete(
  "/deleteRegisterUser/:id",
  verifyToken,
  authController.deleteRegisterUser
);

// Login Route
router.post(
  "/loginUser",
  validator.validator("loginUser"),
  authController.loginUser
);

module.exports = router;
