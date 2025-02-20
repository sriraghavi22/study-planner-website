import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GroupPage from './GroupPage';
import GroupList from './GroupList';
import Dashboard from './Dashboard';
import Files from './Files';
import Task from './Task';
import Chat from './components/Chat';

function App() {
  return (
    <Router basename="/dashboard/index.html">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/groups" element={<GroupList />} />
        <Route path="/groups/:groupId" element={<GroupPage />} />
        <Route path="/groups/:groupId/files" element={<Files />} />
        <Route path="/groups/:groupId/tasks" element={<Task />} />
        <Route path="/groups/:groupId/chat" element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;