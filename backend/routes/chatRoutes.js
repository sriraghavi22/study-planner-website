// File: backend/routes/chatRoutes.js
const express = require('express');
const { getMessagesByGroup } = require('../controller/chatController');
const router = express.Router();

router.get('/:groupId', getMessagesByGroup);

module.exports = router;