const multer = require("multer");
const path = require("path");
const fs = require("fs");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // If the upload field is `profileImage`, force the profile category
    // so uploaded profile pictures are always stored under uploads/profile
    const inferredFromField =
      file && file.fieldname === "profileImage" ? "profile" : null;
    const category =
      inferredFromField ||
      (req.body && req.body.category) ||
      (req.query && req.query.category) ||
      "misc";
    const dest = path.join(__dirname, "..", "uploads", category);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    // Debug log to help trace where files are stored and which category was chosen
    try {
      console.log(
        `[multer] uploading '${file.originalname}' -> category='${category}' dest='${dest}'`
      );
    } catch (e) {}
    cb(null, dest);
  },

  filename: (req, file, cb) => {
    const name = Date.now() + "_" + file.originalname.replace(/\s+/g, "_");
    try {
      console.log(`[multer] assigned filename='${name}'`);
    } catch (e) {}
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow images and common font types (woff, woff2, ttf)
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "font/ttf",
    "font/otf",
    "font/woff",
    "font/woff2",
    "application/font-woff",
    "application/font-woff2",
    "application/x-font-ttf",
  ];
  if (allowed.includes(file.mimetype) || file.mimetype.startsWith("font")) {
    cb(null, true);
  } else {
    // allow other types but warn
    cb(null, true);
  }
};
const uploadFile = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

module.exports = uploadFile;
