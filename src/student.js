import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Student.css';

const StudentDashboard = () => {
  const [assistants, setAssistants] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://127.0.0.1:5000/get_student_assistants', {
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

  const handleOpenChat = (id) => {
    navigate(`/chat/${id}`);
  };

  return (
    <div className="student-dashboard">
      <h1>Student Dashboard</h1>
      <div className="assistants">
        {assistants.map(assistant => (
          <div key={assistant.id} className="assistant-card text-black" onClick={() => handleOpenChat(assistant.id)}>
            <h2>Subject: {assistant.subject}</h2>
            <p>Class: {assistant.class_name}</p>
            <p>Teacher: {assistant.teacher}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;
