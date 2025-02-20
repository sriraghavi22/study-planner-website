const Message = require('../models/Message');

// Add a message to the database
const addMessage = async ({ groupId, username, message }) => {
  if (!groupId || !username || !message) {
    throw new Error('groupId, username, and message are required.');
  }

  try {
    const newMessage = new Message({ groupId, username, message });
    const savedMessage = await newMessage.save();
    return savedMessage;
  } catch (error) {
    throw new Error(`Failed to save message: ${error.message}`);
  }
};

// Get messages by grou 

const getMessagesByGroup = async (req, res) => {
  const { groupId } = req.params;

  if (!groupId) {
    return res.status(400).json({ error: 'Group ID is required.' });
  }

  try {
    const messages = await Message.find({ groupId }).sort({ timestamp: 1 }); // Sorted by timestamp
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch messages: ${error.message}` });
  }
};

module.exports = { addMessage, getMessagesByGroup };