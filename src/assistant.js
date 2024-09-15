import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Assistant.css';

const Assistant = () => {
  const { id } = useParams();
  const [assistant, setAssistant] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/get_assistant/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      }
    })
    .then(response => response.json())
    .then(data => {
      setAssistant(data.assistant);
      setStudents(data.assistant.allowed_students);
    })
    .catch(error => {
      console.error('Error fetching assistant:', error);
    });
  }, [id]);

  const handleAddStudent = () => {
    // Add student to assistant logic here
    // For now, just add to the local state
    setStudents([...students, studentId]);
    setStudentId('');
  };

  if (!assistant) {
    return <div>Loading...</div>;
  }

  return (
    <div className="assistant-container w-full">
      <div className="top-section">
        <div className="left-section">
          <div className="left-top">
            <input type="file" className="upload-input" />
            <button className="upload-button">Upload File</button>
          </div>
          <div className="left-bottom">
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter Student ID"
            />
            <button onClick={handleAddStudent}>Add Student</button>
            <ul>
              {students.map((student, index) => (
                <li key={index}>{student}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="right-section">
          <h2>Uploaded Files</h2>
          {/* Display uploaded files here */}
        </div>
      </div>
      <div className="bottom-section">
        <div className="assistant-details">
          <p>Subject: {assistant.subject}</p>
          <p>Class Name: {assistant.class_name}</p>
        </div>
        <div className="social-icons">
          <button className="icon-button"><i className="fab fa-instagram"></i></button>
          <button className="icon-button"><i className="fab fa-whatsapp"></i></button>
          <button className="icon-button"><i className="fas fa-globe"></i></button>
          <button className="icon-button"><i className="fab fa-telegram"></i></button>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
