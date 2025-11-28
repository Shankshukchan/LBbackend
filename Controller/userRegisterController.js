const { userTable } = require('../Model/table');
const bcrypt = require("bcrypt");

const userRegisterController = async (req, res) => {
    try {
        const { FullName, email, password } = req.body;
        const isFound = await userTable.findOne({ email });
        if (isFound) {
            return res.status(400).json({
                success: false,
                message: "User already registered"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const data = new userTable({ FullName, email, password: hashedPassword });
        await data.save();
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Registration error', err });
    }
};

module.exports = userRegisterController;
