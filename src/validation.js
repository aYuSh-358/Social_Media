const { check, oneOf, validationResult, body } = require("express-validator");
exports.validator = (method) => {
  switch (method) {
    // Create User Validation
    case "createUser": {
      return [
        body("userName").notEmpty().withMessage("Name is required"),

        body("userEmail")
          .notEmpty()
          .withMessage("Email is required")
          .isEmail()
          .withMessage("Invalid email address")
          .normalizeEmail()
          .isLength({ max: 30 })
          .withMessage("Email should not exceed 30 characters"),

        body("userPassword")
          .isLength({ min: 8 })
          .withMessage("Password must be at least 8 characters long")
          .matches(/[a-z]/)
          .withMessage("Password must contain at least one lowercase")
          .matches(/[A-Z]/)
          .withMessage("Password must contain at least one uppercase")
          .matches(/[0-9]/)
          .withMessage("Password must contain at least one number")
          .matches(/[@$!%*?&]/)
          .withMessage(
            "Password must contain at least one special character (@,$,!,%,*,?,&)"
          ),

        body("userDOB")
          .notEmpty()
          .withMessage("Date of Birth is required")
          .isISO8601()
          .withMessage("DOB must be a valid date (YYYY-MM-DD format)"),

        body("userMobileNo")
          .notEmpty()
          .withMessage("Mobile Number is required")
          .isLength({ min: 10, max: 10 })
          .withMessage("Mobile Number must be 10 digits")
          .matches(/^[0-9]+$/)
          .withMessage("Mobile Number must contain only numerical values"),

        //body('userAddress').notEmpty().withMessage('User address is required')
      ];
    }

    // Update User Validation
    case "updateUser": {
      return [
        body("userName").optional().notEmpty().withMessage("Name is required"),

        body("userEmail")
          .optional()
          .notEmpty()
          .isEmail()
          .withMessage("Invalid email address")
          .normalizeEmail()
          .isLength({ max: 30 })
          .withMessage("Email should not exceed 30 characters"),

        body("userPassword")
          .optional()
          .isLength({ min: 8 })
          .withMessage("Password must be at least 8 characters long")
          .matches(/[a-z]/)
          .withMessage("Password must contain at least one lowercase")
          .matches(/[A-Z]/)
          .withMessage("Password must contain at least one uppercase")
          .matches(/[0-9]/)
          .withMessage("Password must contain at least one number")
          .matches(/[@$!%*?&]/)
          .withMessage(
            "Password must contain at least one special character (@,$,!,%,*,?,&)"
          ),

        body("userDOB")
          .optional()
          .notEmpty()
          .withMessage("Date of Birth is required")
          .isISO8601()
          .withMessage("DOB must be a valid date (YYYY-MM-DD format)"),

        body("userMobileNo")
          .optional()
          .notEmpty()
          .withMessage("Mobile Number is required")
          .isLength({ min: 10, max: 10 })
          .withMessage("Mobile Number must be 10 digits")
          .matches(/^[0-9]+$/)
          .withMessage("Mobile Number must contain only numerical values"),

        // body('userAddress').optional().notEmpty().withMessage('User address is required')
      ];
    }

    // Register user Validation
    case "registerUser": {
      return [
        body("userName", "Username is required").notEmpty(),
        body("userEmail", "Valid email is required").isEmail(),
        body("userPassword")
          .optional()
          .isLength({ min: 8 })
          .withMessage("Password must be at least 8 characters long")
          .matches(/[a-z]/)
          .withMessage("Password must contain at least one lowercase")
          .matches(/[A-Z]/)
          .withMessage("Password must contain at least one uppercase")
          .matches(/[0-9]/)
          .withMessage("Password must contain at least one number")
          .matches(/[@$!%*?&]/)
          .withMessage(
            "Password must contain at least one special character (@,$,!,%,*,?,&)"
          ),
        body("userDOB")
          .notEmpty()
          .withMessage("Date of Birth is required")
          .isISO8601()
          .withMessage("DOB must be a valid date (YYYY-MM-DD format)"),

        body("userMobileNo")
          .notEmpty()
          .withMessage("Mobile Number is required")
          .isLength({ min: 10, max: 10 })
          .withMessage("Mobile Number must be 10 digits")
          .matches(/^[0-9]+$/)
          .withMessage("Mobile Number must contain only numerical values"),
      ];
    }

    // Login user Validation
    case "loginUser": {
      return [
        body("userEmail", "Valid email is required").isEmail(),
        body("userPassword", "Password is required").exists(),
      ];
    }
  }
};
