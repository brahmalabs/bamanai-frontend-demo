import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCrown, faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import './TeacherDashboard.css';
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import moment from 'moment'; // Import moment.js for date formatting

const TeacherDashboard = () => {
  const [assistants, setAssistants] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [about, setAbout] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
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
        class_name: className,
        about,
        profile_picture: imageUrl
      })
    })
    .then(response => response.json())
    .then(data => {
      setAssistants([...assistants, { id: data.assistant_id, subject, class_name: className }]);
      setShowPopup(false);
      setSubject('');
      setClassName('');
      setAbout('');
      setImageUrl('');
      toastr.success('Assistant created successfully');
    })
    .catch(error => {
      console.error('Error creating assistant:', error);
      toastr.error('Error creating assistant');
    });
  };

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    const blob = new Blob([file], { type: file.type });
    formData.set('files', blob, file.name);

    fetch('http://localhost:8888/upload', {
      method: 'POST',
      body: formData,
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.file) {
        setImageUrl(data.file[0]);
        toastr.success('Image uploaded successfully');
      } else {
        toastr.error('Error uploading image');
      }
    })
    .catch(error => {
      console.error('Error uploading image:', error);
      toastr.error('Error uploading image');
    });
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

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
        <div className="links mt-2">
          <a href="#" className="link bg-teal-100 text-slate-800 p-2 text-left pl-4">Assistants</a>
          <button className="add-assistant-button mt-4 w-3/4 mx-auto rounded-md bg-teal-600 text-white hover:bg-teal-700" onClick={handleAddAssistant}>Add Assistant</button>
        </div>
        <div className="bottom-links mb-2">
          <a href="#" className="link text-left flex items-center pl-4 hover:bg-teal-100"><FontAwesomeIcon icon={faCrown} className="text-teal-600" />   Upgrade</a>
          <a href="#" className="link text-left flex items-center pl-4 hover:bg-teal-100"><FontAwesomeIcon icon={faCircleQuestion} className="text-teal-600" />   Help Center</a>
        </div>
      </div>
      <div className="main-content text-slate-800">
        <h1 className="text-2xl font-bold text-left mb-4 border-b-2 border-teal-600 pb-2"><span onClick={() => navigate('/')} className='border-b-2 border-teal-600 hover:cursor-pointer'> BamanAI</span> /  <span className="text-teal-600">Assistants</span></h1>
        <div className="assistants">
          {assistants.map(assistant => (
            <div key={assistant.id} className="assistant-card text-black" onClick={() => handleOpenAssistant(assistant.id)}>
              <img src={assistant.profile_picture || 'https://robohash.org/bamanai'} alt="Profile" className="assistant-profile-picture w-1/2 h-1/2 mx-auto" />
              <h2 className="text-teal-600 text-center text-xl"> {assistant.subject} | {assistant.class_name} </h2>
              <p className="text-left text-sm text-ellipsis">{assistant.about}</p>
              <p className="text-left text-xs text-gray-500">Last updated: {moment(assistant.updated_at).fromNow()}</p>
            </div>
          ))}
        </div>
        {showPopup && (
          <div className="modal">
            <div className="modal-content" ref={popupRef}>
              <span className="close" onClick={handleClosePopup}>&times;</span>
              <h2 className="modal-title text-slate-800 text-center mb-4">Create Assistant</h2>
              <label className="modal-label text-slate-800 text-left">  
                Profile Picture:
                <div {...getRootProps({ className: 'dropzone' })} className="dropzone border-2 border-teal-600 rounded-md p-4">
                  <input {...getInputProps()} />
                  {imageUrl ? (
                    <div className="uploaded-image">
                      <img src={imageUrl} className="w-1/2 max-h-20 max-w-20 m-auto" alt="Uploaded" />
                      <FontAwesomeIcon icon={faEdit} className="edit-icon" />
                    </div>
                  ) : (
                    <p>Drag 'n' drop an image here, or click to select one</p>
                  )}
                </div>
              </label>
              <label className="modal-label text-slate-800 text-left">
                Subject:
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2 border border-teal-600 outline-teal-600 rounded-md" />
              </label>
              <label className="modal-label text-slate-800 text-left">
                Class Name:
                <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} className="w-full p-2 border border-teal-600 outline-teal-600 rounded-md" />
              </label>
              <label className="modal-label text-slate-800 text-left">
                About:
                <textarea value={about} onChange={(e) => setAbout(e.target.value)} className="w-full p-2 border border-teal-600 outline-teal-600 rounded-md" />
              </label>
              
              {uploadProgress > 0 && <progress value={uploadProgress} max="100">{uploadProgress}%</progress>}
              <button onClick={handleCreateAssistant} className="modal-button w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-md">Create Assistant</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
