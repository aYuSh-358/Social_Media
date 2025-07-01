const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Social Media",
      version: "1.0.0",
      description: "Social Media project API Documentation",
    },
    servers: [
      {
        url: "https://talksy-xzl6.onrender.com",
        // url: "http://localhost:5000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [
    "./src/controllers/authController.js",
    "./src/controllers/postController.js",
    "./src/controllers/storyController.js",
    "./src/controllers/chatController.js",
    "./src/controllers/blockController.js",
    "./src/controllers/requestController.js",
    "./src/controllers/notificationController.js",
  ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };
