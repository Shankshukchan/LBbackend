const { userTable } = require("../Model/table");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userLoginController = async (req, res) => {
  try {
    const { email, password, FullName } = req.body;
    const user = await userTable.findOne({ email });
    if (user && user.FullName == FullName) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const token = jwt.sign(
          { id: user._id, role: user.role, isAdmin: user.isAdmin },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );
        return res.status(200).json({
          success: true,
          message: "Login successful",
          token,
          data: user,
        });
      }
    }
    res.status(401).json({ success: false, message: "Invalid credentials" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login error", err });
  }
};

module.exports = userLoginController;
