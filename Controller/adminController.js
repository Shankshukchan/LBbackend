const { userTable } = require("../Model/table");

// Return all registered users (no password field)
const getAllUsersController = async (req, res) => {
  try {
    const users = await userTable.find({}).select("-password").lean();
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error("Error fetching users", err);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching users", err });
  }
};

module.exports = {
  getAllUsersController,
};
