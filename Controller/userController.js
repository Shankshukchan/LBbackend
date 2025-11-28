const userRegisterController = require('./userRegisterController');
const userLoginController = require('./userLoginController');
const { uploadProfileImageController, updateUserProfileController } = require('./userProfileController');

module.exports = {
    userRegisterController,
    userLoginController,
    uploadProfileImageController,
    updateUserProfileController
};