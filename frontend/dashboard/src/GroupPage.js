import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const GroupPage = () => {
  const { groupId } = useParams(); // Get groupId from route
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch group details on component mount
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const res = await axios.get(`/api/groups/${groupId}`);
        setGroup(res.data);
      } catch (err) {
        console.error('Error fetching group details:', err);
        setError('Failed to fetch group details.');
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Add member to group
  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!isValidEmail(newMemberEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    try {
      const res = await axios.put(`/api/groups/${groupId}/add-member`, { email: newMemberEmail });
      setGroup(res.data); // Update group state with new data
      setSuccess(`Member ${newMemberEmail} added successfully!`);
      setNewMemberEmail('');
      setError('');
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member. Please try again.');
    }
  };

  // Remove member from group
  const handleRemoveMember = async (email) => {
    try {
      const res = await axios.put(`/api/groups/${groupId}/remove-member`, { email });
      setGroup(res.data); // Update group state with new data
      setSuccess(`Member ${email} removed successfully!`);
      setError('');
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member. Please try again.');
    }
  };

  // Delete group
  const handleDeleteGroup = async () => {
    try {
      await axios.delete(`/api/groups/${groupId}`);
      setSuccess('Group deleted successfully!');
      setGroup(null); // Clear the group state
      navigate('/groups');
    } catch (err) {
      console.error('Error deleting group:', err);
      setError('Failed to delete group.');
    }
  };

  if (!group) {
    return <p>{error || 'Loading group details...'}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
      {/* Navbar for Chat, Goals, and Files */}
      <nav style={{ display: 'flex', gap: '20px', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '8px' }}>
        <Link to={`/groups/${groupId}/chat`} style={{ textDecoration: 'none', color: 'blue' }}>Chat</Link>
        <Link to={`/groups/${groupId}/tasks`} style={{ textDecoration: 'none', color: 'blue' }}>Tasks</Link>
        <Link to={`/groups/${groupId}/files`} style={{ textDecoration: 'none', color: 'blue' }}>Files</Link>
      </nav>

      {/* Main Group Information */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Group Info Section */}
        <div style={{ flex: '1', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h1>{group.name}</h1>
          <p><strong>Description:</strong> {group.description}</p>
          <p><strong>Members:</strong></p>
          <ul>
            {group.members.map((member, index) => (
              <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {member}
                <button onClick={() => handleRemoveMember(member)} style={{ marginLeft: '10px', color: 'red' }}>
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div>
            <h3>Add a Member</h3>
            <input
              type="email"
              placeholder="Enter member's email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              style={{ marginRight: '10px' }}
            />
            <button onClick={handleAddMember}>Add Member</button>
          </div>

          <button onClick={handleDeleteGroup} style={{ marginTop: '10px', padding: '10px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px' }}>
            Delete Group
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default GroupPage;
