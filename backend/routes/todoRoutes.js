const express = require('express');
const router = express.Router();
const { getTodos, addTodo, updateTodo, deleteTodo } = require('../controller/todoController.js');
const authenticateToken = require('../middleware/authenticateToken');

// Get all To-Do items for a user
router.get('/', authenticateToken, getTodos);

// Create a new To-Do item
router.post('/', authenticateToken, addTodo);

// Update a To-Do item (mark as completed or update text)
router.put('/:id', authenticateToken, updateTodo);

// Delete a To-Do item
router.delete('/:id', authenticateToken, deleteTodo);

module.exports = router;