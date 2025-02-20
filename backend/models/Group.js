const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  members: [{ type: String }], // Store emails of group members
  files: [{ type: String }], // Store file paths or names
  createdBy: { type: String, required: true }, // Email of the user who created the group
});

module.exports = mongoose.model('Group', GroupSchema);