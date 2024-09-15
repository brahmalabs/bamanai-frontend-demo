import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [assistants, setAssistants] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch assistants on component mount
    fetch('http://127.0.0.1:5000/get_assistants', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      }
    })
    .then(response => response.json())
    .then(data => {
      setAssistants(data.assistants);
    })
    .catch(error => {
      console.error('Error fetching assistants:', error);
    });
  }, []);

  const handleAddAssistant = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleCreateAssistant = () => {
    fetch('http://127.0.0.1:5000/create_assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: JSON.stringify({
        subject,
        class_name: className
      })
    })
    .then(response => response.json())
    .then(data => {
      setAssistants([...assistants, { id: data.assistant_id, subject, class_name: className }]);
      setShowPopup(false);
      setSubject('');
      setClassName('');
    })
    .catch(error => {
      console.error('Error creating assistant:', error);
    });
  };

  const handleOpenAssistant = (id) => {
    navigate(`/assistant/${id}`);
  };

  return (
    <div className="teacher-dashboard">
      <h1>Teacher Dashboard</h1>
      <button className="add-assistant-button" onClick={handleAddAssistant}>Add Assistant</button>
      <div className="assistants">
        {assistants.map(assistant => (
          <div key={assistant.id} className="assistant-card text-black">
            <h2>Subject: {assistant.subject}</h2>
            <p>Class: {assistant.class_name}</p>
            <button className="open-assistant-button" onClick={() => handleOpenAssistant(assistant.id)}>Open</button>
          </div>
        ))}
      </div>
      {showPopup && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleClosePopup}>&times;</span>
            <h2 className="modal-title text-black text-center">Create Assistant</h2>
            <label className="modal-label text-black text-left">
              Subject:
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label className="modal-label text-black text-left">
              Class Name:
              <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} />
            </label>
            <button onClick={handleCreateAssistant} className="modal-button">Create</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
