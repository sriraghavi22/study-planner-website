const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Title of the task
  description: { type: String, required: true }, // Task description
  assignees: {
    type: [String], // Change this to an array of strings
    default: [],
  }, // Assignee's email
  createdBy: { type: String, required: true }, // The user who created the task
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true }, // Reference to the group
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }, // Task priority
  reminder: { type: String }, // Task reminder
  deadline: { type: Date, default: null }, // Task deadline
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' }, // Task status
  createdAt: { type: Date, default: Date.now }, // Creation date
  comments: [
    {
      text: { type: String, required: true },
      createdBy: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  files: [
    {
      name: { type: String, required: true },
      path: { type: String, required: true },
      uploadedBy: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model('Task', TaskSchema);
