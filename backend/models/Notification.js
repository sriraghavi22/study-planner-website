const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: [{ type: String, required: true }], // Email of the user
  message: { type: String, required: true }, // Notification message
  timestamp: { type: Date, default: Date.now }, // When the notification was created
  groupId: { type: String, required: true }, // Group ID for the notification
});

module.exports = mongoose.model('Notification', notificationSchema);