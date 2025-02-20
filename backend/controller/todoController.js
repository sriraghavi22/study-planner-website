const Todo = require('../models/Todo');

const getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.id });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch To-Do items' });
  }
};

const addTodo = async (req, res) => {
  try {
    const { text } = req.body;
    const todo = new Todo({
      userId: req.user.id,
      text,
    });
    await todo.save();
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create To-Do item' });
  }
};

const updateTodo = async (req, res) => {
  try {
    const { text, completed } = req.body;
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { text, completed },
      { new: true }
    );
    if (!todo) {
      return res.status(404).json({ error: 'To-Do item not found' });
    }
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update To-Do item' });
  }
};

const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!todo) {
      return res.status(404).json({ error: 'To-Do item not found' });
    }
    res.json({ message: 'To-Do item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete To-Do item' });
  }
};

module.exports = { getTodos, addTodo, updateTodo, deleteTodo };