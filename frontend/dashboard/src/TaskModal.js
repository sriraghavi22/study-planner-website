import React, { useState, useEffect } from 'react';
import api from './api'; // Import your axios instance
import './TaskModal.css';

const TaskModal = ({ task, onClose }) => {
  const [comments, setComments] = useState(task.comments || []);
  const [newComment, setNewComment] = useState('');
  const [files, setFiles] = useState([]);
  const [newFile, setNewFile] = useState(null);
  const [updatedTask, setUpdatedTask] = useState({ ...task });
  const [groupMembers, setGroupMembers] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchComments = async () => {
          const res = await api.get(`/tasks/${task._id}/comments`);
          setComments(res.data);
        };

        const fetchFiles = async () => {
          const res = await api.get(`/tasks/${task._id}/files`);
          setFiles(res.data);
        };

        const fetchGroupMembers = async () => {
          const res = await api.get(`/groups/${task.groupId}/members`);
          setGroupMembers(res.data);
          setSelectedAssignees(task.assignees || []);
        };

        await Promise.all([fetchComments(), fetchFiles(), fetchGroupMembers()]);
      } catch (err) {
        console.error('Error fetching data:', err.response?.data || err.message);
        setError('Failed to fetch data.');
      }
    };

    fetchData();
  }, [task._id, task.groupId, task.assignees]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      setError('Comment cannot be empty.');
      return;
    }

    try {
      const res = await api.post(`/tasks/${task._id}/comments`, { comment: newComment });
      setComments([...comments, res.data]);
      setNewComment('');
      setSuccess('Comment added successfully!');
    } catch (err) {
      console.error('Error adding comment:', err.response?.data || err.message);
      setError('Failed to add comment.');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!newFile) return;

    const formData = new FormData();
    formData.append('file', newFile);

    try {
      const res = await api.post(`/tasks/${task._id}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFiles([...files, res.data]);
      setNewFile(null);
      setSuccess('File uploaded successfully!');
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file.');
    }
  };

  const handleFileDownload = async (fileId) => {
    try {
      const response = await api.get(`/tasks/${task._id}/files/download/${fileId}`, {
        responseType: 'blob', // Important to handle binary data
      });
  
      // Create a URL for the file
      const fileURL = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = fileURL;
  
      // Extract the filename from response headers or use a default name
      const contentDisposition = response.headers['content-disposition'];
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : 'downloaded-file';
  
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
  
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(fileURL);
  
      setSuccess('File downloaded successfully!');
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file.');
    }
  };
  
  const handleFileDelete = async (fileId) => {
    try {
      await api.delete(`/tasks/${task._id}/files/${fileId}`);
      setFiles(files.filter((file) => file._id !== fileId));
      setSuccess('File deleted successfully!');
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file.');
    }
  };

  const handleAssigneeChange = (member) => {
    setSelectedAssignees((prevAssignees) =>
      prevAssignees.includes(member)
        ? prevAssignees.filter((assignee) => assignee !== member)
        : [...prevAssignees, member]
    );
  };

  const handleTaskUpdate = async () => {
    try {
      await api.put(`/tasks/${task._id}`, { ...updatedTask, assignees: selectedAssignees });
      setSuccess('Task updated successfully!');
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task.');
    }
  };

  const handleInputChange = (e) => {
    setUpdatedTask({ ...updatedTask, [e.target.name]: e.target.value });
  };

  return (
    <div className="task-modal-overlay">
      <div className="task-modal">
        <button className="close-modal-btn" onClick={onClose}>
          &times;
        </button>
        <h2>Task Details</h2>

        <div className="task-details">
          <label>
            Title:
            <input
              type="text"
              name="title"
              value={updatedTask.title}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Description:
            <textarea
              name="description"
              value={updatedTask.description}
              onChange={handleInputChange}
            ></textarea>
          </label>
          <label>
            Assignees:
            <div className="assignees-list">
              {groupMembers.map((member) => (
                <div key={member} className="assignee-item">
                  <input
                    type="checkbox"
                    id={`assignee-${member}`}
                    checked={selectedAssignees.includes(member)}
                    onChange={() => handleAssigneeChange(member)}
                  />
                  <label htmlFor={`assignee-${member}`}>{member}</label>
                </div>
              ))}
            </div>
          </label>
          <label>
            Priority:
            <select
              name="priority"
              value={updatedTask.priority}
              onChange={handleInputChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
          <label>
            Status:
            <select
              name="status"
              value={updatedTask.status}
              onChange={handleInputChange}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
          <button className="update-task-btn" onClick={handleTaskUpdate}>
            Update Task
          </button>
        </div>

        <div className="task-comments">
          <h3>Comments</h3>
          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment._id} className="comment">
                <p>
                  <strong>{comment.createdBy}</strong> (
                  {new Date(comment.createdAt).toLocaleString()})
                </p>
                <p>{comment.text}</p>
              </div>
            ))}
          </div>
          <textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <button className="add-comment-btn" onClick={handleCommentSubmit}>
            Add Comment
          </button>
        </div>

        <div className="task-files">
          <h3>Attachments</h3>
          <ul className="file-list">
            {files.map((file) => (
              <li key={file._id}>
                <p>
                  <strong>{file.name}</strong> (Uploaded on{' '}
                  {new Date(file.uploadedAt).toLocaleString()})
                </p>

                <button
                  className="download-file-btn"
                  onClick={() => handleFileDownload(file._id)}
                >
                  Download
                </button>
                
                <button
                  className="delete-file-btn"
                  onClick={() => handleFileDelete(file._id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={handleFileUpload}>
            <input type="file" onChange={(e) => setNewFile(e.target.files[0])} />
            <button type="submit" className="upload-file-btn">
              Upload File
            </button>
          </form>
        </div>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>
    </div>
  );
};

export default TaskModal;
