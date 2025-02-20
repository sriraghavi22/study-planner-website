import React, { useState, useEffect } from 'react';
import api from './api'; // Import your Axios instance

const Files = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload!');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 201) {
        alert('File uploaded successfully!');
        fetchFiles();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file!');
    }
  };

  const handleFileDelete = async (fileName) => {
    try {
      const response = await api.delete(`/files/${fileName}`);

      if (response.status === 200) {
        alert('File deleted successfully!');
        fetchFiles();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file!');
    }
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '20px' }}>
      <h1>File Management</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          style={{ marginRight: '10px' }}
        />
        <button onClick={handleFileUpload}>Upload File</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '5px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            width: '300px',
          }}
        />
      </div>

      <div>
        <h2>Uploaded Files</h2>
        {filteredFiles.length > 0 ? (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {filteredFiles.map((file) => (
              <li
                key={file.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  borderBottom: '1px solid #ddd',
                }}
              >
                <span>{file.name}</span>
                <div>
                  <button
                    onClick={() => window.open(`/api/files/download/${file.name}`, '_blank')}
                    style={{
                      marginRight: '10px',
                      padding: '5px 10px',
                      backgroundColor: 'blue',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleFileDelete(file.name)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: 'red',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No files uploaded yet.</p>
        )}
      </div>
    </div>
  );
};

export default Files;
