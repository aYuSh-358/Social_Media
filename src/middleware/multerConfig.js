const multer = require("multer");
const path = require("path");

const uploadDir = path.join(__dirname, "../../uploads/posts");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // const uniqueSuffix = file.originalname;
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random());
    const ext = path.extname(file.originalname);
    const newFileName = `post-${uniqueSuffix}${ext}`;
    cb(null, newFileName);
  },
});

module.exports.upload = multer({ storage });
