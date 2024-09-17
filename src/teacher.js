import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import toastr from 'toastr';

const TeacherDashboard = () => {
  const [assistants, setAssistants] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [teacherInfo, setTeacherInfo] = useState({});
  const navigate = useNavigate();
  const popupRef = useRef(null);

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
      // toastr.success('Assistants fetched successfully');
    })
    .catch(error => {
      console.error('Error fetching assistants:', error);
      toastr.error('Error fetching assistants');
    });

    // Fetch teacher info
    fetch('http://127.0.0.1:5000/get_teacher_info', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      }
    })
    .then(response => response.json())
    .then(data => {
      setTeacherInfo(data.teacher);
      // toastr.success('Teacher info fetched successfully');
    })
    .catch(error => {
      console.error('Error fetching teacher info:', error);
      toastr.error('Error fetching teacher info');
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

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
      toastr.success('Assistant created successfully');
    })
    .catch(error => {
      console.error('Error creating assistant:', error);
      toastr.error('Error creating assistant');
    });
  };

  const handleOpenAssistant = (id) => {
    navigate(`/assistant/${id}`);
  };

  return (
    <div className="teacher-dashboard w-full h-full">
      <div className="sidebar text-slate-800">
        <div className="profile-section w-full mt-4">
          <img src={teacherInfo.profile_picture} alt="Profile" className="profile-picture w-1/2 h-1/2 mx-auto" />
          <h2 className="text-center text-2xl font-bold mt-4 border-b-2 border-slate-800 w-full mb-4 pb-2 text-teal-600">{teacherInfo.name}</h2>
        </div>
        <hr />
        <div className="links">
          <a href="#" className="link bg-teal-100 text-slate-800 p-2 text-left pl-4">Assistants</a>
          <button className="add-assistant-button mt-4 w-3/4 mx-auto rounded-md bg-teal-600 text-white" onClick={handleAddAssistant}>Add Assistant</button>
        </div>
        <div className="bottom-links">
          <a href="#" className="link text-left flex items-center pl-4 hover:bg-teal-100"><FontAwesomeIcon icon={faGear} className="text-teal-600" />   Settings</a>
          <a href="#" className="link text-left flex items-center pl-4 hover:bg-teal-100"><FontAwesomeIcon icon={faCircleQuestion} className="text-teal-600" />   Help Center</a>
        </div>
      </div>
      <div className="main-content text-slate-800">
        <h1 className="text-2xl font-bold text-left mb-4 border-b-2 border-teal-600 pb-2">Teacher Dashboard / <span className="text-teal-600">Assistants</span></h1>
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
            <div className="modal-content" ref={popupRef}>
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
    </div>
  );
};

export default TeacherDashboard;
