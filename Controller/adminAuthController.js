const Admin = require("../Model/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const ensureDefaultAdmin = async () => {
  try {
    const existing = await Admin.findOne({ username: "adminLB" });
    if (!existing) {
      const hash = await bcrypt.hash("123456", 10);
      await Admin.create({ username: "adminLB", passwordHash: hash });
      console.log("Default admin created: adminLB / 123456");
    }
  } catch (err) {
    console.error("ensureDefaultAdmin", err);
  }
};

// Call on load (best-effort)
ensureDefaultAdmin();

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    const token = jwt.sign(
      { username: admin.username, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.error("adminLogin", err);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};

const changeAdminPassword = async (req, res) => {
  try {
    const { username } = req.user || {};
    if (!username)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const { oldPassword, newPassword } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    const ok = await bcrypt.compare(oldPassword, admin.passwordHash);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "Old password incorrect" });
    const newHash = await bcrypt.hash(newPassword, 10);
    admin.passwordHash = newHash;
    await admin.save();
    return res.status(200).json({ success: true, message: "Password changed" });
  } catch (err) {
    console.error("changeAdminPassword", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to change password" });
  }
};

module.exports = { adminLogin, changeAdminPassword };
