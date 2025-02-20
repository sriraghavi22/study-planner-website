const express = require('express');
const { signup, login, refresh } = require('../controller/userController');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);

module.exports = router;