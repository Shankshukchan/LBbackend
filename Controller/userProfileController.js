const { userTable } = require("../Model/table");
const path = require("path");
const fs = require("fs");

// User profile update controller with image upload
const updateUserProfileController = async (req, res) => {
  try {
    const {
      email,
      userId,
      FullName,
      birthdate,
      caste,
      religion,
      age,
      marriageStatus,
    } = req.body;
    // Prefer authenticated user id when available (req.user set by JWT middleware)
    const authUserId = req.user && req.user.id;
    // Accept either userId (preferred) or email to identify the user
    if (!authUserId && !userId && !email) {
      return res
        .status(400)
        .json({ success: false, message: "userId or email is required" });
    }
    let updateData = { updatedAt: Date.now() };

    if (FullName) updateData.FullName = FullName;
    if (birthdate) updateData.birthdate = birthdate;
    if (caste) updateData.caste = caste;
    if (religion) updateData.religion = religion;
    if (age) updateData.age = age;
    if (marriageStatus) updateData.marriageStatus = marriageStatus;
    // If a file was uploaded, store a relative path pointing to the
    // profile directory. Multer is configured to save profile images
    // under uploads/profile when the fieldname is `profileImage`.
    if (req.file) {
      // store POSIX style path so path separators are consistent across OS
      updateData.profileImage = path.posix.join("profile", req.file.filename);
    }
    // Build query: prefer authenticated user id, then explicit userId, then email
    const query = authUserId
      ? { _id: authUserId }
      : userId
      ? { _id: userId }
      : { email };
    const user = await userTable.findOneAndUpdate(query, updateData, {
      new: true,
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "User profile updated", data: user });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error updating user profile", err });
  }
};

// Get user profile controller (by userId or email)
const getUserProfileController = async (req, res) => {
  try {
    const { userId, email } = req.query;
    if (!userId && !email) {
      return res
        .status(400)
        .json({ success: false, message: "userId or email is required" });
    }
    const query = userId ? { _id: userId } : { email };
    const user = await userTable.findOne(query).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // Do not expose filesystem paths. If a profile image exists, return only the filename.
    if (user.profileImage) {
      user.profileImage = user.profileImage; // filename only
    }
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Error fetching user profile", err });
  }
};

// Serve profile image file only to the owner (authenticated user)
const serveProfileImageController = async (req, res) => {
  try {
    const requestedUserId = req.params.userId;
    // req.user is set by JWT middleware and contains { id: ... }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (String(req.user.id) !== String(requestedUserId)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: cannot access other user's image",
      });
    }

    const user = await userTable.findOne({ _id: requestedUserId }).lean();
    if (!user || !user.profileImage) {
      return res
        .status(404)
        .json({ success: false, message: "Profile image not found" });
    }

    const uploadsDir = path.join(__dirname, "../uploads");
    const filePath = path.join(uploadsDir, user.profileImage);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "Image file missing on server" });
    }

    // Send the file as a download/inline response
    return res.sendFile(filePath);
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Error serving image", err });
  }
};

module.exports = {
  updateUserProfileController,
  getUserProfileController,
  serveProfileImageController,
};
