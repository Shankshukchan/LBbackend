const mongoose = require("mongoose");

const AssetSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String },
  url: { type: String, required: true },
  category: {
    type: String,
    enum: ["border", "adminPhoto", "font", "misc"],
    default: "misc",
  },
  mimeType: { type: String },
  size: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Asset", AssetSchema);
