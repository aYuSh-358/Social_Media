const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "userProfilePhoto") {
      folder = "DP";
    } else if (file.fieldname === "story") {
      const id = req.params.id;

      const filePath = path.join(__dirname, `../../uploads/Story/${id}`);
      if (fs.existsSync(filePath)) {
        folder = `Story/${id}`;
      } else {
        fs.mkdirSync(filePath, { recursive: true });
        folder = `Story/${id}`;
      }
    } else {
      folder = "posts";
    }
    const uploadDir = path.join(
      __dirname,
      `../../../Social_Media/uploads/${folder}`
    );
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = file.originalname;
    const ext = path.extname(file.originalname);
    const newFileName = `${uniqueSuffix}${ext}`;
    cb(null, newFileName);
  },
});

module.exports.upload = multer({ storage });
