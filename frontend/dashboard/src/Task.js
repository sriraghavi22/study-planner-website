import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import TaskModal from './TaskModal'; // Task details modal component
import api from './api'; // Using the custom axios instance
import './Task.css';
// import 'font-awesome/css/font-awesome.min.css'; // Import Font Awesome CSS
// @import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/css/all.css'; // Import Font Awesome CSS

const Task = () => {
  const { groupId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'Low',
  });
  const [groupMembers, setGroupMembers] = useState([]);
  const [checkedAssignees, setCheckedAssignees] = useState([]);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [reminder, setReminder] = useState(''); 

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get(`/tasks/${groupId}`);
        setTasks(res.data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to fetch tasks.');
      }
    };
    fetchTasks();
  }, [groupId]);

  // Fetch group members
  useEffect(() => {
    const fetchGroupMembers = async () => {
      try {
        const res = await api.get(`/groups/${groupId}/members`);
        setGroupMembers(res.data);
      } catch (err) {
        console.error('Error fetching group members:', err);
        setError('Failed to fetch group members.');
      }
    };
    fetchGroupMembers();
  }, [groupId]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get(`tasks/notifications/${groupId}`);
        setNotifications(res.data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifications();
  }, [groupId]);

  const deleteNotification = async (id) => {
    try {
      await api.delete(`tasks/notifications/${id}`);
      setNotifications(notifications.filter((notification) => notification._id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification.');
    }
  };

  // Handle input changes for the new task
  const handleInputChange = (e) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  // Handle assignee checkbox change
  const handleAssigneeChange = (member) => {
    setCheckedAssignees((prev) =>
      prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]
    );
  };

  // Add new task
  const handleAddTask = async () => {
    if (!newTask.title.trim() || !newTask.description.trim()) {
      setError('Title and description are required.');
      return;
    }

    try {
      const res = await api.post(`/tasks/${groupId}`, {
        ...newTask,
        assignees: checkedAssignees, // Include assignees
        reminder
      });
      setTasks([...tasks, res.data]);
      setSuccess('Task added successfully!');
      setNewTask({ title: '', description: '', deadline: '', priority: 'Low' });
      setCheckedAssignees([]); // Reset selected assignees
      setReminder(''); // Reset reminder
      setError('');
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Failed to add task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter((task) => task._id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  // Handle task drag and drop
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const updatedTasks = [...tasks];
    const [movedTask] = updatedTasks.splice(source.index, 1);
    movedTask.status = destination.droppableId;
    updatedTasks.splice(destination.index, 0, movedTask);
    setTasks(updatedTasks);

    try {
      await api.put(`/tasks/${movedTask._id}`, { status: movedTask.status });
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status.');
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = () => {
    let filteredTasks = [...tasks];

    if (filter) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.priority === filter ||
          task.status === filter ||
          task.assignees.includes(filter)
      );
    }

    if (sort) {
      filteredTasks.sort((a, b) => {
        if (sort === 'Deadline') return new Date(a.deadline) - new Date(b.deadline);
        if (sort === 'Priority') return a.priority.localeCompare(b.priority);
        return 0;
      });
    }

    return filteredTasks;
  };

  const filteredTasks = applyFiltersAndSort();

  return (
    <div className="task-container">
      <div className="header">
        <h1>Group Tasks</h1>
        {/* Notification Bell */}
        <div className="notification-icon" onClick={() => setShowNotifications(!showNotifications)}>
          <i className="fas fa-bell"></i> {/* Use a bell icon */}
          {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="notification-panel">
          <h3>Notifications</h3>
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div key={index} className="notification-item">
                <button onClick={() => deleteNotification(notification._id)}><i className="fa fa-times"></i></button>
                <p>{notification.message}</p>
                <small>{new Date(notification.timestamp).toLocaleString()}</small>
              </div>
            ))
          ) : (
            <p>No notifications</p>
          )}
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="filter-sort">
        <select onChange={(e) => setFilter(e.target.value)}>
          <option value="">Filter By</option>
          <option value="Low">Low Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="High">High Priority</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort By</option>
          <option value="Deadline">Deadline</option>
          <option value="Priority">Priority</option>
        </select>
      </div>

      {/* Task Form */}
      <div className="task-form">
        <h2>Create a New Task</h2>
        <input
          type="text"
          name="title"
          placeholder="Task Title"
          value={newTask.title}
          onChange={handleInputChange}
        />
        <textarea
          name="description"
          placeholder="Task Description"
          value={newTask.description}
          onChange={handleInputChange}
        ></textarea>
        <div className="assignees-checklist">
          <h3>Assign to:</h3>
          {groupMembers.map((member) => (
            <label key={member} className="checkbox-container">
              <input
                type="checkbox"
                value={member}
                checked={checkedAssignees.includes(member)}
                onChange={() => handleAssigneeChange(member)}
              />
              {member}
            </label>
          ))}
        </div>
        <input
          type="date"
          name="deadline"
          value={newTask.deadline}
          onChange={handleInputChange}
        />
        <select name="priority" value={newTask.priority} onChange={handleInputChange}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select name="reminder" value={reminder} onChange={(e) => setReminder(e.target.value)}>
          <option value="">Set Reminder</option>
          <option value="1 day before">1 Day Before</option>
          <option value="1 hour before">1 Hour Before</option>
          <option value="30 minutes before">30 Minutes Before</option>
        </select>
        <button onClick={handleAddTask} className="add-task-btn">
          Add Task
        </button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {['Pending', 'In Progress', 'Completed'].map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div
                  className="kanban-column"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  <h2>{status}</h2>
                  {filteredTasks
                    .filter((task) => task.status === status)
                    .map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided) => (
                          <div
                            className="task-card"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setSelectedTask(task)}
                          >
                            <h3>{task.title}</h3>
                            <p>{task.description}</p>
                            <p>
                              <strong>Assignees:</strong>{' '}
                              {task.assignees.length > 0
                                ? task.assignees.join(', ')
                                : 'Unassigned'}
                            </p>
                            <p>
                              <strong>Priority:</strong> {task.priority}
                            </p>
                            <p>
                              <strong>Deadline:</strong>{' '}
                              {task.deadline || 'No deadline'}
                            </p>
                            <button
                              className="delete-task-btn"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering other click handlers
                                handleDeleteTask(task._id); // Pass the task ID to delete
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default Task;
