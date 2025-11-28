const Template = require("../Model/template");

const listTemplates = async (req, res) => {
  try {
    const templates = await Template.find({}).lean();
    return res.status(200).json({ success: true, data: templates });
  } catch (err) {
    console.error("listTemplates", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to list templates" });
  }
};

const createTemplate = async (req, res) => {
  try {
    const { name, category, type, description, media } = req.body;
    if (!name)
      return res.status(400).json({ success: false, message: "Name required" });
    const tpl = new Template({ name, category, type, description, media });
    await tpl.save();
    return res.status(201).json({ success: true, data: tpl });
  } catch (err) {
    console.error("createTemplate", err);
    return res.status(500).json({ success: false, message: "Create failed" });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const tpl = await Template.findByIdAndUpdate(id, updates, { new: true });
    if (!tpl)
      return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, data: tpl });
  } catch (err) {
    console.error("updateTemplate", err);
    return res.status(500).json({ success: false, message: "Update failed" });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const tpl = await Template.findByIdAndDelete(id);
    if (!tpl)
      return res.status(404).json({ success: false, message: "Not found" });
    return res.status(200).json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("deleteTemplate", err);
    return res.status(500).json({ success: false, message: "Delete failed" });
  }
};

module.exports = {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
