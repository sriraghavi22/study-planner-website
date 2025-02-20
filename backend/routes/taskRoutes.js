const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authenticateToken = require('../middleware/authenticateToken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// Create a new task
router.post('/:groupId', authenticateToken, async (req, res) => {
  try {
    const { title, description, assignees, deadline, priority, reminder } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const task = new Task({
      title,
      description,
      assignees: assignees && assignees.length > 0 ? assignees : [req.user.email], // Store an array of assignees
      deadline,
      priority,
      reminder, // Store reminder details
      createdBy: req.user.email,
      groupId: req.params.groupId,
    });

    await task.save();

    // Add a notification for the assignees
    const notifications = assignees.map((assignee) => ({
      user: assignee,
      message: `New task assigned: ${title}`,
      timestamp: new Date(),
      groupId: req.params.groupId,
    }));
    await Notification.insertMany(notifications); // Save notifications to the database

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Failed to create task.', error: error.message });
  }
});

// Get all tasks for a group
router.get('/:groupId', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ groupId: req.params.groupId });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks.', error: error.message });
  }
});

// Update a task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update the task.', error: error.message });
  }
});

// Delete a task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete the task.', error: error.message });
  }
});

router.get('/notifications/:groupId', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ groupId: req.params.groupId, user: req.user.email }).sort({ timestamp: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications.', error: error.message });
  }
});

router.delete('/notifications/:id', authenticateToken, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Notification deleted successfully.' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification.', error: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    // Check if the user owns the notification
    if (notification.user !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to delete this notification.' });
    }

    await Notification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: 'Notification deleted successfully.' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification.', error: error.message });
  }
});

// // Storage for file uploads
// const upload = multer({ dest: 'uploads/' });

// // Add a comment to a task
// const mongoose = require('mongoose');

// POST route to add a comment
router.post('/:taskId/comments', authenticateToken, async (req, res) => {
  try {
    const { comment } = req.body;

    // Validate comment
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ message: 'Comment cannot be empty.' });
    }
    if (comment.trim().length > 500) {
      return res.status(400).json({ message: 'Comment is too long. Maximum allowed length is 500 characters.' });
    }

    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(req.params.taskId)) {
      return res.status(400).json({ message: 'Invalid task ID.' });
    }

    // Fetch task from database
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Create new comment
    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      text: comment.trim(),
      createdBy: req.user.email,
      createdAt: new Date(),
    };

    // Add comment to task and save
    task.comments = task.comments || [];
    task.comments.push(newComment);
    await task.save();

    res.status(200).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error.message);
    res.status(500).json({ message: 'Failed to add comment.', error: error.message });
  }
});

// GET route to fetch all comments for a task
router.get('/:taskId/comments', authenticateToken, async (req, res) => {
  try {
    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(req.params.taskId)) {
      return res.status(400).json({ message: 'Invalid task ID.' });
    }

    // Fetch task from database
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Return all comments
    res.status(200).json(task.comments || []);
  } catch (error) {
    console.error('Error fetching comments:', error.message);
    res.status(500).json({ message: 'Failed to fetch comments.', error: error.message });
  }
});

// Upload a file to a task
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir); // Ensure 'uploads' folder exists
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Maximum file size: 10MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.docx', '.xlsx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error('Unsupported file format.'));
    }
    cb(null, true);
  },
});

// Upload a file to a task
router.post('/:taskId/files', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(req.params.taskId)) {
      fs.unlinkSync(file.path); // Delete uploaded file if task ID is invalid
      return res.status(400).json({ message: 'Invalid task ID.' });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      fs.unlinkSync(file.path); // Delete uploaded file if task not found
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Add file metadata to the task
    if (!task.files) {
      task.files = [];
    }
    task.files.push({
      name: file.originalname,
      path: file.path,
      uploadedBy: req.user.email,
      uploadedAt: new Date(),
    });

    console.log(file.path)

    await task.save();
    res.status(200).json({ message: 'File uploaded successfully.', file: task.files });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload file.', error: error.message });
  }
});

// Fetch all files for a task
router.get('/:taskId/files', authenticateToken, async (req, res) => {
  try {
    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(req.params.taskId)) {
      return res.status(400).json({ message: 'Invalid task ID.' });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    res.status(200).json(task.files || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch files.', error: error.message });
  }
});

// Delete a file from a task
router.delete('/:taskId/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { taskId, fileId } = req.params;

    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid task ID.' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const fileIndex = task.files.findIndex((file) => file._id.toString() === fileId);
    if (fileIndex === -1) {
      return res.status(404).json({ message: 'File not found.' });
    }

    // Remove the file metadata and delete the file from the filesystem
    const [file] = task.files.splice(fileIndex, 1);
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await task.save();
    res.status(200).json({ message: 'File deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete file.', error: error.message });
  }
});


router.get('/:taskId/files/download/:fileId', async (req, res) => {
  try {
    const { taskId, fileId } = req.params;

    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid task ID.' });
    }

    // Fetch the task by ID
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Find the file within the task's files array
    const file = task.files.find((f) => f._id.toString() === fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found in task.' });
    }

    // Check if the file exists in the filesystem
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: 'File not found on server.' });
    }

    // Serve the file for download
    res.download(file.path, file.name, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ message: 'Error downloading file.' });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

module.exports = router;
