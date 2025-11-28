const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "..", "uploads");

// Upload is handled by multer in the route; this handler just returns the stored filename
const uploadMedia = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    const category =
      (req.body && req.body.category) ||
      (req.query && req.query.category) ||
      "misc";
    return res.status(201).json({
      success: true,
      data: {
        filename: req.file.filename,
        url: `/uploads/${category}/${req.file.filename}`,
        category,
      },
    });
  } catch (err) {
    console.error("uploadMedia error", err);
    return res
      .status(500)
      .json({ success: false, message: "Upload failed", err });
  }
};

// List files. If category query param is provided, list only that subfolder
const listMedia = async (req, res) => {
  try {
    const category = (req.query && req.query.category) || null;
    let targetDir = uploadsDir;
    if (category) {
      targetDir = path.join(uploadsDir, category);
      if (!fs.existsSync(targetDir))
        return res.status(200).json({ success: true, data: [] });
    }
    const files = fs.readdirSync(targetDir).map((f) => {
      const stat = fs.statSync(path.join(targetDir, f));
      const url = category ? `/uploads/${category}/${f}` : `/uploads/${f}`;
      return {
        filename: f,
        url,
        size: stat.size,
        mtime: stat.mtime,
      };
    });
    return res.status(200).json({ success: true, data: files });
  } catch (err) {
    console.error("listMedia error", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to list media", err });
  }
};

// Delete a file by filename
const deleteMedia = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename)
      return res
        .status(400)
        .json({ success: false, message: "filename required" });
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath))
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    fs.unlinkSync(filePath);
    return res.status(200).json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("deleteMedia error", err);
    return res
      .status(500)
      .json({ success: false, message: "Delete failed", err });
  }
};

module.exports = { uploadMedia, listMedia, deleteMedia };
