import axios from 'axios';

const API_URL = '/api/dashboard';

export const fetchDashboardData = async () => {
  const response = await axios.get(`${API_URL}`);
  return response.data;
};

export const createGroup = async (groupData) => {
  const response = await axios.post(`${API_URL}/groups`, groupData);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await axios.post(`${API_URL}/tasks`, taskData);
  return response.data;
};

export const updateTaskStatus = async (taskId, status) => {
  const response = await axios.put(`${API_URL}/tasks/${taskId}`, { status });
  return response.data;
};

export const deleteGroup = async (groupId) => {
  const response = await axios.delete(`${API_URL}/groups/${groupId}`);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await axios.delete(`${API_URL}/tasks/${taskId}`);
  return response.data;
};