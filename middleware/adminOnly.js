module.exports = (req, res, next) => {
  try {
    // Expect authentication middleware to have set req.user
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    // Simple role check - look for role or isAdmin flag on token payload
    if (user.role === "admin" || user.isAdmin) return next();
    return res.status(403).json({ message: "Admin access required" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
