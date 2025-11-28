const express = require("express");
const app = express();
const cors = require("cors");
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

// CORS configuration
// If ALLOW_ALL_CORS=true is set in env (use with caution), accept any origin.
// Otherwise, use FRONTEND_ORIGINS (comma-separated) to restrict allowed origins.
const allowAll = String(process.env.ALLOW_ALL_CORS).toLowerCase() === "true";
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "https://lbbackend.onrender.com")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (allowAll) return callback(null, true);
    // Allow non-browser tools (curl, Postman) where origin is undefined
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    try {
      const parsed = new URL(origin);
      const hostname = parsed.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1")
        return callback(null, true);
    } catch (err) {}
    console.warn(`Blocked CORS origin: ${origin}`);
    return callback(
      new Error("CORS policy: This origin is not allowed - " + origin)
    );
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

// Apply CORS as an early middleware so that preflight and errors include appropriate headers
app.use(cors(corsOptions));

// Global fallback to ensure CORS headers are present even if later middleware errors
app.use((req, res, next) => {
  // If headers already set by cors middleware, skip
  if (!res.getHeader("Access-Control-Allow-Origin")) {
    if (allowAll) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    } else if (
      req.headers.origin &&
      allowedOrigins.indexOf(req.headers.origin) !== -1
    ) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    }
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  // Respond to preflight quickly
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
app.options("/update-profile", cors(corsOptions));

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
app.get("/health", cors(corsOptions), (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    allowedOrigins,
  });
});

// Global error handler: ensure CORS headers are present on error responses
// and return a consistent JSON error payload.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err && (err.stack || err));
  // Ensure CORS headers if not already set
  if (!res.getHeader("Access-Control-Allow-Origin")) {
    if (allowAll) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    } else if (
      req.headers.origin &&
      allowedOrigins.indexOf(req.headers.origin) !== -1
    ) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    }
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  if (res.headersSent) return next(err);
  const status = err && err.status ? err.status : 500;
  res
    .status(status)
    .json({
      success: false,
      message: err && err.message ? err.message : "Internal Server Error",
    });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
