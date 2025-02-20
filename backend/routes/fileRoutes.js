const express = require('express');
const multer = require('multer');
const File = require('../models/File');
const fs = require('fs');
const path = require('path');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

// Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Route: Upload a file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = new File({
      name: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
    });

    await file.save();
    res.status(201).json({ message: 'File uploaded successfully', file });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Get all files
router.get('/',authenticateToken, async (req, res) => {
  try {
    const files = await File.find().sort({ uploadDate: -1 });
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Download a file
router.get('/download/:fileName',  async (req, res) => {
  try {
    const file = await File.findOne({ name: req.params.fileName });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(file.path, file.name);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Delete a file
router.delete('/:fileName', authenticateToken, async (req, res) => {
  try {
    const file = await File.findOne({ name: req.params.fileName });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Remove file from the file system
    try {
        fs.unlinkSync(file.path);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('Error deleting file from file system:', err);
          return res.status(500).json({ message: 'Server error' });
        }
      }
  
      // Remove file metadata from the database
      await File.findByIdAndDelete(file._id);
  
      res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
