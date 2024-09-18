import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Student.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faCircleQuestion, faSignOut, faCopy } from '@fortawesome/free-solid-svg-icons';
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';

const StudentDashboard = () => {
  const [assistants, setAssistants] = useState([]);
  const [studentInfo, setStudentInfo] = useState({});
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

    fetch('http://127.0.0.1:5000/get_student_info', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      }
    })
    .then(response => response.json())
    .then(data => {
      setStudentInfo(data.student);
    })
    .catch(error => {
      console.error('Error fetching student info:', error);
      toastr.error('Error fetching student info');
    });
  }, []);

  const handleOpenChat = (id) => {
    navigate(`/chat/${id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    navigate('/');
  };

  const handleCopyID = () => {
    navigator.clipboard.writeText(studentInfo.id);
    toastr.success('ID copied to clipboard');
  };

  return (
    <div className="student-dashboard w-full h-full">
      <div className="sidebar text-slate-800">
        <div className="profile-section w-full mt-4">
          <img src={studentInfo.profile_picture} alt="Profile" className="profile-picture w-1/2 h-1/2 mx-auto" />
          <h2 className="text-center text-2xl font-bold mt-4 border-b-2 border-slate-800 w-full mb-4 pb-2 text-teal-600">{studentInfo.name}</h2>
          
        </div>
        <hr />
        <div className="links mt-2">
          <a href="/student" className="link bg-teal-100 text-slate-800 p-2 text-left pl-4">Assistants</a>
          <p onClick={handleCopyID} className="tooltip-s text-center text-base border-2 border-teal-600 p-2 w-10/12 m-auto mt-2 hover:cursor-pointer text-ellipsis">
            {studentInfo?.id?.slice(0, 8)}...{studentInfo?.id?.slice(-6)} 
            <FontAwesomeIcon icon={faCopy} className="ms-1 text-teal-600" /> 
            <div className="tooltiptext-s">
              Click to copy your ID
            </div>
          </p>
        </div>
        <div className="bottom-links mb-2">
          <a href="#" className="link text-left flex items-center pl-4 hover:bg-teal-100"><FontAwesomeIcon icon={faCrown} className="text-teal-600" />   Upgrade</a>
          <a href="#" className="link text-left flex items-center pl-4 hover:bg-teal-100"><FontAwesomeIcon icon={faCircleQuestion} className="text-teal-600" />   Help Center</a>
          <button className="logout-button mt-4 w-3/4 mx-auto rounded-md bg-red-600 text-white hover:bg-red-700" onClick={handleLogout}>Logout <FontAwesomeIcon icon={faSignOut} className="text-white"/></button>
        </div>
      </div>
      <div className="main-content text-slate-800">
        <h1 className="text-2xl font-bold text-left mb-4 border-b-2 border-teal-600 pb-2"><span onClick={() => navigate('/')} className='border-b-2 border-teal-600 hover:cursor-pointer'> BamanAI</span> /  <span className="text-teal-600">Assistants</span></h1>
        <div className="assistants-s">
          {assistants.map(assistant => (
            <div key={assistant.id} className="assistant-card-s overflow-hidden pb-2 text-black" onClick={() => handleOpenChat(assistant.id)}>
              <img src={assistant.profile_picture || 'https://robohash.org/bamanai'} alt="Profile" className="assistant-profile-picture w-1/2 h-1/2 mx-auto" />
              <p className="text-teal-600 text-center text-xl mt-0 mb-0"> {assistant.teacher} </p>
              <p className="text-slate-800 text-center text-xl mt-0 mb-0"> ( {assistant.subject} | {assistant.class_name} ) </p>
              <p className="text-center text-sm text-balance">{assistant.about || "No description available..."}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
