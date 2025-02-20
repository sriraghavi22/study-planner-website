const { addMessage } = require('./controller/chatController');

let io;

const setupSocket = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: ['http://127.0.0.1:5000', 'http://localhost:5000'], // Adjust if frontend runs on another port
      methods: ['GET', 'POST'],
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle joining a group
    socket.on("joinGroup", ({ groupId, email }) => {
      if (!groupId || !email) {
        console.warn("Missing groupId or email in joinGroup event.");
        return;
      }
      socket.join(groupId);
      console.log(`User with email ${email} joined group: ${groupId}`);
    });

    // Handle incoming messages
    socket.on("message", async ({ groupId, email, message }) => {
      console.log("Incoming message data:", { groupId, email, message });

      if (!groupId || !email || !message) {
        console.warn("Invalid data: groupId, email, and message are required.");
        return;
      }

      try {
        const savedMessage = await addMessage({ groupId, username: email, message });
        io.to(groupId).emit("message", {
          groupId: savedMessage.groupId,
          username: savedMessage.username, // Email is saved as username
          message: savedMessage.message,
          timestamp: savedMessage.timestamp,
        });
      } catch (error) {
        console.error("Error saving message:", error.message);
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { groupId, isTyping, username } = data;

      if (!groupId || !username) {
        console.warn("Missing groupId or username in typing event.");
        return;
      }

      // Broadcast to others in the group
      socket.to(groupId).emit('typing', {
        groupId,
        isTyping,
        username,
      });
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

module.exports = { setupSocket };