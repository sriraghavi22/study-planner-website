import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Dashboard.css';
import api from './api'; // Import your axios instance

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const localizer = momentLocalizer(moment);
  const [progress, setProgress] = useState(0);
  const [personalGoals, setPersonalGoals] = useState([]);
  const [selectedGroupTasks, setSelectedGroupTasks] = useState([]);
  const [newGoal, setNewGoal] = useState(""); // For user input
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');


  // Color mapping for priorities
  const priorityColors = {
    High: '#ff0000', // Red for high priority
    Medium: '#ffa500', // Orange for medium priority
    Low: '#008000', // Green for low priority
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Fetch data from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard'); // Use axios instance
        const data = response.data;
        setGroups(data.groups || []);
        setTasks(data.tasks || []);
        console.log('Dashboard data:', data);

        const groupMapping = data.groups.reduce((map, group) => {
          map[group._id] = group.name; // Map groupId to groupName
          return map;
        }, {});

        const filteredTasks = data.tasks.filter((task) => {
          const groupMatch = selectedGroup === 'All' || task.groupId === selectedGroup;
          const priorityMatch = selectedPriority === 'All' || task.priority === selectedPriority;
          return groupMatch && priorityMatch;
        });
        

        // Format tasks into calendar events
        const formattedEvents = filteredTasks.map((task) => ({
          title: `${task.title} (${task.priority}) - Group: ${groupMapping[task.groupId] || "N/A"}`,
          start: new Date(task.createdAt),
          end: task.deadline ? new Date(task.deadline) : new Date(task.createdAt),
          color: priorityColors[task.priority] || '#000000', // Default to black if priority is unknown
        }));
        setEvents(formattedEvents);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedGroup, selectedPriority]);

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const totalTasks = tasks.length + personalGoals.length;
      const completedTasks =
        tasks.filter((task) => task.status === "Completed").length +
        personalGoals.filter((goal) => goal.completed).length;
    
      setProgress(totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
    } else {
        setProgress(0); // No tasks
    }
  }, [tasks]);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await api.get("/todos");
        const allTodos = response.data;
        setPersonalGoals(allTodos.filter((todo) => !todo.completed)); // Show only incomplete tasks
      } catch (error) {
        console.error("Error fetching To-Do items:", error);
      }
    };
    fetchTodos();
  }, []);

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }
  
  const addGoal = async () => {
    try {
      if (newGoal.trim()) {
        const response = await api.post("/todos", { text: newGoal });
        setPersonalGoals([...personalGoals, response.data]);
        setNewGoal("");
      }
    } catch (error) {
      console.error("Error adding To-Do item:", error);
    }
  };
  
  const toggleCompletion = async (goal) => {
    try {
      const updatedGoal = { ...goal, completed: !goal.completed };
      await api.put(`/todos/${goal._id}`, updatedGoal);
      setPersonalGoals(personalGoals.map((g) => (g._id === goal._id ? updatedGoal : g)));
    } catch (error) {
      console.error("Error updating To-Do item:", error);
    }
  };
  
  const deleteGoal = async (goalId) => {
    try {
      await api.delete(`/todos/${goalId}`);
      setPersonalGoals(personalGoals.filter((g) => g._id !== goalId));
    } catch (error) {
      console.error("Error deleting To-Do item:", error);
    }
  };
  

  const handleLogout = async () => {
    try {
      await await api.post("/logout") // Call the correct endpoint
      .then((response) => {
          console.log("Logout successful:", response.data);
          // Clear localStorage and redirect
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userName");
          localStorage.removeItem("userId");
          localStorage.removeItem("userEmail");
          window.location.href = "http://localhost:5000/frontend/index.html";
      })
      .catch((error) => {
          console.error("Logout failed:", error);
      }); // Send logout request to the server
      // navigate('/index.html'); // Redirect to index.html
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Custom event styling
  const eventStyleGetter = (event) => {
    const backgroundColor = event.color;
    return {
      style: {
        backgroundColor,
        color: '#ffffff', // White text for better contrast
        borderRadius: '5px',
        border: 'none',
      },
    };
  };

  return (
    <div className="dashboard">
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            <i className="bi bi-house-door-fill"></i> My Dashboard
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link active" to="/groups">
                  Groups
                </Link>
              </li>
              <li className="nav-item">
                <button className="btn btn-danger nav-link" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container-fluid main-content">
        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3 sidebar bg-light">
            <h5 className="text-center mt-4">Quick Links</h5>
            <ul className="list-group">
              <li onClick={() => scrollToSection('calendar')} className="list-group-item">
                <i className="bi bi-calendar-check"></i> View Calendar
              </li>
              <li onClick={() => scrollToSection('todo')} className="list-group-item">
                <i className="bi bi-card-list"></i> To-Do List
              </li>
              <li onClick={() => scrollToSection('progress')} className="list-group-item">
                <i className="bi bi-graph-up"></i> Progress Tracker
              </li>
              {/* <li className="list-group-item">
                <i className="bi bi-people-fill"></i> Manage Groups
              </li> */}
            </ul>
          </div>

          {/* Main Dashboard */}
          <div className="col-md-9 main-dashboard">
            <div className="row mt-4">
              {/* Recent Activities */}
              <div className="col-md-6">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Recent Activities</h5>
                    <ul>
                      {groups.map((group) => (
                        <li key={group._id}>
                          Joined Group: <b>{group.name}</b>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="col-md-6">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Notifications</h5>
                    <ul>
                      {tasks.map((task) => (
                        <li key={task._id}>
                          Task: <b>{task.title}</b> - {task.status} - {task.priority}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div id = "calendar">
            {/* filters */}
            <div className="row mt-4">
              <div className="col-md-6">
                <label htmlFor="groupFilter">Filter by Group:</label>
                <select
                  id="groupFilter"
                  className="form-select"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                >
                  <option value="All">All Groups</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="priorityFilter">Filter by Priority:</label>
                <select
                  id="priorityFilter"
                  className="form-select"
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>


            {/* Calendar */}
            <div className="row mt-4">
              <div className="col-md-12">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Task Calendar</h5>
                    <div style={{ height: 500 }}>
                      <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 500 }}
                        eventPropGetter={eventStyleGetter} // Apply custom styles
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
            {/* Progress Tracker */}
            <div id = "progress">
            <div style={{ margin: "20px", width: "50%" }}>
              <h4>Task Progress</h4>

              {/* Progress Bar */}
              <div style={{ backgroundColor: "#e0e0e0", borderRadius: "5px", width: "100%", height: "30px" }}>
                  <div
                      style={{
                          width: `${progress}%`,
                          height: "100%",
                          backgroundColor: progress === 100 ? "green" : "#007bff",
                          borderRadius: "5px",
                          textAlign: "center",
                          color: "white",
                          lineHeight: "30px",
                          transition: "width 0.5s ease-in-out"
                      }}
                  >
                      {progress}%
                  </div>
              </div>
          </div>
          </div>
          <div id="todo">
      <div className="card mt-4">
        <div className="card-body">
          <h5 className="card-title">To-Do List</h5>

          {/* Add Personal Goals */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Add your personal goal..."
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
            />
            <button className="btn btn-primary mt-2" onClick={addGoal}>
              Add Goal
            </button>
          </div>

          {/* Display Personal Goals */}
          <h6>Personal Goals</h6>
          <ul className="list-group mb-3">
            {personalGoals.map((goal) => (
              <li
                key={goal._id}
                className={`list-group-item d-flex justify-content-between align-items-center ${
                  goal.completed ? "list-group-item-success" : ""
                }`}
              >
                <span
                  onClick={() => toggleCompletion(goal)}
                  style={{
                    textDecoration: goal.completed ? "line-through" : "none",
                    cursor: "pointer",
                  }}
                >
                  {goal.text}
                </span>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteGoal(goal._id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        

            
            </div>
          </div>
          </div> 
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


