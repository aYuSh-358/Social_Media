// const multer = require("multer");
// const path = require("path");

// const uploadDir = path.join(__dirname, "../../uploads/DP");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     //const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     const uniqueSuffix = file.originalname;
//     const ext = path.extname(file.originalname);
//     const newFileName = `post-${uniqueSuffix}${ext}`;
//     cb(null, newFileName);
//   },
// });

// module.exports.upload = multer({ storage });

const multer = require("multer");
const path = require("path");

const uploadDir = path.join(__dirname, "../../uploads/DP");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    //let folder = "post";
    if (req.file === "DP") {
      folder = "DP";

    } else {
      folder = "post";
    }
    const uploadDir = path.join(__dirname, `../../uploads/${folder}`);

    //fs.mkdirSync(uploadDir, { recursive: true });

    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    //const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const uniqueSuffix = file.originalname;
    const ext = path.extname(file.originalname);
    const newFileName = `post-${uniqueSuffix}${ext}`;
    cb(null, newFileName);
  }
});

module.exports.upload = multer({ storage });
