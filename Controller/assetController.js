const path = require("path");
const fs = require("fs");
const Asset = require("../Model/asset");

// helper to build URL path for a file
const makeUrl = (category, filename) => `/uploads/${category}/${filename}`;

const uploadAsset = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: "No file" });
    const category = req.body.category || "misc";
    // Ensure category folder exists
    const targetDir = path.join(__dirname, "..", "uploads", category);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // If multer saved the file somewhere else (e.g., uploads/ or images/), move it into the category folder
    const currentPath = req.file.path; // absolute path where multer wrote the file
    const desiredPath = path.join(targetDir, req.file.filename);
    try {
      if (
        currentPath &&
        path.resolve(currentPath) !== path.resolve(desiredPath)
      ) {
        // Move the file
        fs.renameSync(currentPath, desiredPath);
        console.log(
          `Moved uploaded file from ${currentPath} -> ${desiredPath}`
        );
      }
    } catch (moveErr) {
      console.warn("Failed to move uploaded file to category folder", moveErr);
      // continue; asset creation will still reference category path
    }

    const asset = await Asset.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: makeUrl(category, req.file.filename),
      category,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
    return res.status(201).json({ success: true, data: asset });
  } catch (err) {
    console.error("uploadAsset", err);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
};

const listAssets = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const assets = await Asset.find(filter).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: assets });
  } catch (err) {
    console.error("listAssets", err);
    return res.status(500).json({ success: false, message: "List failed" });
  }
};

const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findById(id);
    if (!asset)
      return res.status(404).json({ success: false, message: "Not found" });
    // delete file from disk
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      asset.category,
      asset.filename
    );
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    // Some mongoose setups may return plain objects; don't assume document.remove exists
    if (asset && typeof asset.remove === "function") {
      await asset.remove();
    } else {
      await Asset.findByIdAndDelete(id);
    }
    return res.status(200).json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("deleteAsset", err);
    return res.status(500).json({ success: false, message: "Delete failed" });
  }
};

module.exports = { uploadAsset, listAssets, deleteAsset };
