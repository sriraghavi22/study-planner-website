require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const http = require('http');
const { setupSocket } = require('./socket');
const Notification = require('./models/Notification'); // Path to the Notification model
const Task = require('./models/Task'); // Path to the Task model
const cron = require('node-cron');

const app = express();
const server = http.createServer(app); // Create an HTTP server for Socket.io
setupSocket(server); // Set up Socket.io with the HTTP server

// Configure CORS middleware
app.use(
  cors({
    origin: [
      'http://127.0.0.1:3000',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.use(bodyParser.json());

// Serve static files (e.g.,zz uploads and React build)
app.use('/uploads', express.static('uploads'));
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '../frontend/dashboard/build')));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// API routes
app.use('/api', userRoutes);
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/todos', require('./routes/todoRoutes'));
// Logout route
app.post('/api/logout', (req, res) => {
  // Perform necessary logout operations like clearing cookies or tokens
  // res.clearCookie('authToken'); // Example: Clear authentication cookie
  res.status(200).json({ message: 'Logout successful' });
});


function parseReminder(reminder) {
  const match = reminder.match(/(\d+)\s(\w+)/);
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'minute':
    case 'minutes':
      return value * 60 * 1000;
    case 'hour':
    case 'hours':
      return value * 60 * 60 * 1000;
    case 'day':
    case 'days':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

// Cron job to send reminders
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();

    // Fetch tasks with reminders that need to be sent
    const upcomingTasks = await Task.find({
      reminder: { $exists: true },
      deadline: { $gt: now }, // Deadline must be in the future
    });

    for (const task of upcomingTasks) {
      const reminderTime = new Date(task.deadline.getTime() - parseReminder(task.reminder));
      if (now >= reminderTime) {
        for (const assignee of task.assignees) {
          const existingNotification = await Notification.findOne({
            user: assignee,
            message: `Reminder: Task "${task.title}" is approaching its deadline.`,
            groupId: task.groupId,
          });

          if (!existingNotification) {
            const notification = new Notification({
              user: assignee,
              message: `Reminder: Task "${task.title}" is approaching its deadline.`,
              groupId: task.groupId,
            });
            await notification.save(); // Save the notification
            console.log(`Notification sent for task: ${task.title}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error triggering reminders:', error);
  }
});

// 404 handler for API routes (must come before React's fallback)
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

// Serve React build for all other routes (React app)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard/build/index.html'));
});

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
