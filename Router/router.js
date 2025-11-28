const express = require("express");
const router = express.Router();
const userRegisterController = require("../Controller/userRegisterController");
const userLoginController = require("../Controller/userLoginController");
const { getAllUsersController } = require("../Controller/adminController");
const {
  uploadMedia,
  listMedia,
  deleteMedia,
} = require("../Controller/mediaController");
const {
  uploadAsset,
  listAssets,
  deleteAsset,
} = require("../Controller/assetController");
const {
  updateUserProfileController,
  getUserProfileController,
  serveProfileImageController,
} = require("../Controller/userProfileController");
const AuthSignIn = require("../middleware/jwtAuthentication");
const adminOnly = require("../middleware/adminOnly");
const uploadFile = require("../middleware/multer");
const {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require("../Controller/templateController");
const {
  adminLogin,
  changeAdminPassword,
} = require("../Controller/adminAuthController");

router.post("/register", userRegisterController);
router.post("/login", userLoginController);
// Admin login (separate endpoint)
router.post("/admin/login", adminLogin);

// Route: update user details (with image upload)
router.post(
  "/update-profile",
  AuthSignIn,
  uploadFile.single("profileImage"),
  updateUserProfileController
);
// Route: fetch user profile by userId or email
router.get("/get-profile", getUserProfileController);

// Admin: get all users (admin-only)
router.get("/users", AuthSignIn, adminOnly, getAllUsersController);

// Media routes (upload/list/delete) - require admin
router.post(
  "/media",
  AuthSignIn,
  adminOnly,
  uploadFile.single("file"),
  uploadMedia
);
router.get("/media", AuthSignIn, adminOnly, listMedia);
router.delete("/media/:filename", AuthSignIn, adminOnly, deleteMedia);

// Assets routes for categorized uploads (borders, adminPhoto, fonts)
router.post(
  "/assets",
  AuthSignIn,
  adminOnly,
  uploadFile.single("file"),
  uploadAsset
);
router.get("/assets", AuthSignIn, adminOnly, listAssets);
router.delete("/assets/:id", AuthSignIn, adminOnly, deleteAsset);

// Public listing for assets (so editor and normal users can fetch borders/admin photos)
router.get("/assets/public", listAssets);

// Template records CRUD (admin-only for create/update/delete)
router.get("/templates", AuthSignIn, adminOnly, listTemplates);
// Public templates listing (used by the frontend templates page)
router.get("/templates/public", listTemplates);
router.post("/templates", AuthSignIn, adminOnly, createTemplate);
router.put("/templates/:id", AuthSignIn, adminOnly, updateTemplate);
router.delete("/templates/:id", AuthSignIn, adminOnly, deleteTemplate);

// Serve profile image - only accessible by the owner
router.get("/profile-image/:userId", AuthSignIn, serveProfileImageController);

// Admin change password (requires admin token)
router.post(
  "/admin/change-password",
  AuthSignIn,
  adminOnly,
  changeAdminPassword
);

module.exports = router;
