const express = require('express');
const multer = require('multer');
const Group = require('../models/Group');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Upload directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Unique filenames
  },
});
const upload = multer({ storage });

// Create a new group
router.post('/', authenticateToken, async (req, res) => {
  const { name, description } = req.body;

  try {
    if (!name || !description) {
      return res.status(400).json({ message: 'Group name and description are required.' });
    }

    const group = new Group({
      name,
      description,
      createdBy: req.user.email, // Email of the logged-in user
      members: [req.user.email], // Add the creator to the members list
      files: [],
    });

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Fetch all groups
router.get('/', authenticateToken, async (req, res) => {
  try {
    // console.log("Authenticated user:", req.user.email);
    const groups = await Group.find({ members: req.user.email });
    res.json(groups);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Fetch a single group by ID
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.json(group);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Add a member to a group
router.put('/:id/add-member', async (req, res) => {
  const { email } = req.body;

  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    if (!group.members.includes(email)) {
      group.members.push(email);
    }

    await group.save();
    res.json(group);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Remove a member from a group
router.put('/:id/remove-member', async (req, res) => {
  const { email } = req.body;

  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    group.members = group.members.filter((member) => member !== email);

    await group.save();
    res.json(group);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Delete a group
router.delete('/:id', async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    res.json({ msg: 'Group removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// Upload files to a group
router.post('/:id/upload-file', upload.single('file'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    group.files.push(req.file.filename);
    await group.save();

    res.json({ msg: 'File uploaded successfully', group });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

router.get('/:groupId/members', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(group.members);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;