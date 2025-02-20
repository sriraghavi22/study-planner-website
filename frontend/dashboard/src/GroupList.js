import React, { useEffect, useState } from 'react';
import api from './api'; // Import the Axios instance
import { Link } from 'react-router-dom';
import './GroupList.css'; // Import the CSS file for styling

const GroupList = () => {
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get('/groups');
        setGroups(res.data);
      } catch (error) {
        setError('Error fetching groups. Please try again.');
      }
    };

    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!newGroupName.trim() || !newGroupDescription.trim()) {
      setError('Group name and description are required.');
      return;
    }

    try {
      const res = await api.post('/groups', {
        name: newGroupName,
        description: newGroupDescription,
      });

      setGroups((prevGroups) => [...prevGroups, res.data]);
      setSuccess('Group created successfully!');
      setNewGroupName('');
      setNewGroupDescription('');
      setError('');
      setShowForm(false);
    } catch (error) {
      setError('Failed to create group. Please try again.');
    }
  };

  return (
    <div className="group-list-container">
      <h1>Group List</h1>
      <button className="create-group-btn" onClick={() => setShowForm((prev) => !prev)}>
        {showForm ? 'Cancel' : 'Create Group'}
      </button>

      {showForm && (
        <div className="form-modal">
          <div className="form-card">
            <h2>Create a New Group</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="form-field">
                <label>Group Name</label>
                <input
                  type="text"
                  placeholder="Enter group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label>Group Description</label>
                <textarea
                  placeholder="Enter group description"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Create Group
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <ul className="group-list">
        {groups.map((group) => (
          <li key={group._id} className="group-item">
            <Link to={`/groups/${group._id}`} className="group-link">
              {group.name}
            </Link>
            <p>{group.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupList;
