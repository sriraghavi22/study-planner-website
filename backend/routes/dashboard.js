const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const Group = require('../models/Group');
const Task = require('../models/Task');

// Dashboard API - Fetch groups and tasks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Fetch groups where the user is a member
    const groups = await Group.find({ members: userEmail });

    // Fetch tasks for each group
    const tasks = await Task.find({ groupId: { $in: groups.map((group) => group._id) } });

    res.json({
      groups,
      tasks,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;