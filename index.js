const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer"); // add multer
const fs = require("fs"); // for folder creation
const router = require("./Router/router");
const DbConnect = require("./Config/dbConfig");
DbConnect();

// Reuse upload middleware and profile controller for top-level route
const uploadFile = require("./middleware/multer");
const {
  updateUserProfileController,
} = require("./Controller/userProfileController");
const AuthSignIn = require("./middleware/jwtAuthentication");

// Ensure images folder exists
const imagesDir = path.join(__dirname, "images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Ensure uploads folder exists and serve it statically so uploaded profile images are accessible
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  // Ensure common subfolders exist for categorized assets
  const categories = ["border", "adminPhoto", "font", "misc"];
  categories.forEach((c) => {
    const p = path.join(uploadsDir, c);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  });
}

// Multer storage config for images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Minimal allow-all CORS middleware (no origin checks)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());
// Serve images folder statically
app.use("/images", express.static(imagesDir));
// Serve uploads folder statically for profile images
app.use("/uploads", express.static(uploadsDir));

// Example user creation route with image upload
app.post("/api/users", upload.single("image"), async (req, res) => {
  try {
    // Assuming you have a User model and body fields for user data
    const userData = req.body;
    if (req.file) {
      userData.imagePath = `/images/${req.file.filename}`;
    }
    // Save userData (including imagePath) to DB
    // const user = await User.create(userData);
    // res.status(201).json(user);
    res.status(201).json({ ...userData, imagePath: userData.imagePath }); // placeholder response
  } catch (err) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.use("/api", router);

// Respond to preflight requests for the upload route explicitly
// Preflight covered by the allow-all middleware above

// Small logger to debug incoming requests
const logRequest = (req, res, next) => {
  console.log(
    `[upload] ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin}`
  );
  next();
};

app.post(
  "/update-profile",
  AuthSignIn,
  logRequest,
  uploadFile.single("profileImage"),
  updateUserProfileController
);

// Health/debug endpoint to verify server and CORS
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    allowedOrigins: process.env.FRONTEND_ORIGINS || "*",
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
