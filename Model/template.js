const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: "general" },
  type: { type: String, default: "image" },
  description: { type: String, default: "" },
  media: { type: String, default: "" }, // optional link to uploaded media
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Template", TemplateSchema);
