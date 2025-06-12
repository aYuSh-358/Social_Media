const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { body } = require("express-validator");
const validator = require("../validation");
const { validationResult } = require("express-validator");

router.post(
  "/registerUser",
  validator.validator("registerUser"),
  authController.registerUser
);
router.post(
  "/loginUser",
  validator.validator("loginUser"),
  authController.loginUser
);

module.exports = router;
