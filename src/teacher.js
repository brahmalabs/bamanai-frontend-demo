import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCrown, faCircleQuestion, faSignOut } from '@fortawesome/free-solid-svg-icons';
import './TeacherDashboard.css';
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import moment from 'moment'; // Import moment.js for date formatting
import { API_URL, UPLOAD_URL, APP_URL } from './config';

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
  const [showWAPopup, setShowWAPopup] = useState(false);
  const [hasWhatsApp, setHasWhatsApp] = useState(false);
  const [showTelegramPopup, setShowTelegramPopup] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [telegramAccessKey, setTelegramAccessKey] = useState('');
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);


  useEffect(() => {
    // Fetch assistants on component mount
    fetch(`${API_URL}/get_assistants`, {
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
    fetch(`${API_URL}/get_teacher_info`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      }
    })
    .then(response => response.json())
    .then(data => {
      setTeacherInfo(data.teacher);
      if (data.teacher.channels?.whatsapp && data.teacher.channels?.whatsapp?.profile?.is_connected) {
        setHasWhatsApp(true);
      }
      if (data.teacher.channels?.telegram && data.teacher.channels?.telegram?.profile?.is_connected) {
        setTelegramUsername(data.teacher.channels?.telegram?.profile?.username);
        setTelegramAccessKey(data.teacher.channels?.telegram?.profile?.access_key);
      }
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
        setShowWAPopup(false);
        setShowTelegramPopup(false);
      }
    };

    if (showPopup || showWAPopup || showTelegramPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup, showWAPopup, showTelegramPopup]);

  const handleAddAssistant = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleCreateAssistant = () => {
    const checkedChannels = Object.entries(teacherInfo.channels)
      .filter(([key, channel]) => channel?.profile?.is_connected && document.querySelector(`input[name="${key}"]`).checked)
      .map(([key, channel]) => channel._id);

    fetch(`${API_URL}/create_assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: JSON.stringify({
        subject,
        class_name: className,
        about,
        profile_picture: imageUrl,
        connected_channels: checkedChannels 
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

    if (isFilePickerOpen) {
      console.warn('File picker is already open');
      return;
    }
    setIsFilePickerOpen(true);
    const file = acceptedFiles[0];
    const formData = new FormData();
    const blob = new Blob([file], { type: file.type });
    formData.set('files', blob, file.name);

    fetch(`${UPLOAD_URL}`, {
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

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    navigate('/');
  };

  const handleWAPopup = () => {
    setShowWAPopup(true);
  };

  const handleEditWA = () => {
    fetch(`${API_URL}/edit_channel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: JSON.stringify({
        name: 'whatsapp',
        profile: teacherInfo.channels.whatsapp.profile,
        id: teacherInfo.channels.whatsapp.id
      })
    })
    .then(response => response.json())
    .then(data => {
      if (!data.error) {
        setShowWAPopup(false);
        setTeacherInfo({
          ...teacherInfo,
          channels: {
            ...teacherInfo.channels,
            whatsapp: {
              ...teacherInfo.channels.whatsapp,
              profile: { ...teacherInfo.channels.whatsapp.profile, is_connected: true }
            }
          }
        });
        toastr.success('WhatsApp updated successfully');
      } else {
        toastr.error(data.error);
      }
    })
    .catch(error => {
      console.error('Error updating WhatsApp:', error);
      toastr.error('Error updating WhatsApp', error);
    });
  };

  const handleConnectWA = () => {
    console.log('Connecting WhatsApp');
    fetch(`${API_URL}/create_channel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: JSON.stringify({
        name: 'whatsapp',
        profile: teacherInfo.channels.whatsapp.profile
      })
    })
    .then(response => response.json())
    .then(data => {
      if (!data.error) {
        setShowWAPopup(false);
        setTeacherInfo({
          ...teacherInfo,
          channels: {
            ...teacherInfo.channels,
            whatsapp: {
              ...teacherInfo.channels.whatsapp,
              profile: { ...teacherInfo.channels.whatsapp.profile, is_connected: true }
            }
          }
        });
        toastr.success('WhatsApp connected successfully');
      } else {
        toastr.error(data.error);
      }
    })
    .catch(error => {
      console.error('Error connecting WhatsApp:', error);
      toastr.error('Error connecting WhatsApp', error);
    });
  };

  const handleWAInputChange = (e) => {
    const { name, value } = e.target;
    setTeacherInfo({
      ...teacherInfo,
      channels: {
        ...teacherInfo.channels,
        whatsapp: {
          ...teacherInfo.channels.whatsapp,
          profile: { ...teacherInfo.channels?.whatsapp?.profile, [name]: value }
        }
      }
    });
  };

  const handleTelegramPopup = () => {
    setShowTelegramPopup(true);
  };

  const handleCloseTelegramPopup = () => {
    setShowTelegramPopup(false);
  };

  const handleConnectTelegram = () => {
    fetch(`${API_URL}/create_channel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: JSON.stringify({
        name: 'telegram',
        profile: {
          username: telegramUsername,
          access_key: telegramAccessKey
        }
      })
    })
    .then(response => response.json())
    .then(data => {
      if (!data.error) {
        setShowTelegramPopup(false);
        setTeacherInfo({
          ...teacherInfo,
          channels: {
            ...teacherInfo.channels,
            telegram: {
              profile: { username: telegramUsername, access_key: telegramAccessKey, is_connected: true }
            }
          }
        });
        toastr.success('Telegram connected successfully');
      } else {
        toastr.error(data.error);
      }
    })
    .catch(error => {
      console.error('Error connecting Telegram:', error);
      toastr.error('Error connecting Telegram', error);
    });
  };

  const handleEditTelegram = () => {
    fetch(`${API_URL}/edit_channel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: JSON.stringify({
        name: 'telegram',
        profile: {
          username: telegramUsername,
          access_key: telegramAccessKey
        },
        id: teacherInfo.channels.telegram.id
      })
    })
    .then(response => response.json())
    .then(data => {
      if (!data.error) {
        setShowTelegramPopup(false);
        setTeacherInfo({
          ...teacherInfo,
          channels: {
            ...teacherInfo.channels,
            telegram: {
              ...teacherInfo.channels.telegram,
              profile: { username: telegramUsername, access_key: telegramAccessKey, is_connected: true }
            }
          }
        });
        toastr.success('Telegram updated successfully');
      } else {
        toastr.error(data.error);
      }
    })
    .catch(error => {
      console.error('Error updating Telegram:', error);
      toastr.error('Error updating Telegram', error);
    });
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
          <div className='mt-4 text-center text-sm text-gray-500 w-3/4 mx-auto border border-slate-800 rounded-md p-2 hover:cursor-pointer' onClick={handleWAPopup}>Whatsapp: {teacherInfo.channels?.whatsapp?.profile?.phone_number ?? 'Not Connected'}</div>
          <div className='mt-4 text-center text-sm text-gray-500 w-3/4 mx-auto border border-slate-800 rounded-md p-2 hover:cursor-pointer' onClick={handleTelegramPopup}>Telegram: {teacherInfo.channels?.telegram?.profile?.username ?? 'Not Connected'}</div>
        </div>
        <div className="bottom-links mb-2">
          <a href="#" className="link text-left flex items-center pl-4 hover:bg-teal-100"><FontAwesomeIcon icon={faCrown} className="text-teal-600" />   Upgrade</a>
          <a href="#" className="link text-left flex items-center pl-4 hover:bg-teal-100"><FontAwesomeIcon icon={faCircleQuestion} className="text-teal-600" />   Help Center</a>
          <button className="logout-button mt-4 w-3/4 mx-auto rounded-md bg-red-600 text-white hover:bg-red-700" onClick={handleLogout}>Logout <FontAwesomeIcon icon={faSignOut} className="text-white"/></button>
        </div>
      </div>
      <div className="main-content text-slate-800">
        <h1 className="text-2xl font-bold text-left mb-4 border-b-2 border-teal-600 pb-2"><span onClick={() => navigate('/')} className='border-b-2 border-teal-600 hover:cursor-pointer'> BamanAI</span> /  <span className="text-teal-600">Assistants</span></h1>
        <div className="assistants">
          {assistants.map(assistant => (
            <div key={assistant.id} className="assistant-card overflow-hidden pb-1 text-slate-800 hover:cursor-pointer" onClick={() => handleOpenAssistant(assistant.id)}>
              <img src={assistant.profile_picture || 'https://robohash.org/bamanai'} alt="Profile" className="assistant-profile-picture w-1/2 h-1/2 mx-auto" />
              <h2 className="text-teal-600 text-center text-xl"> {assistant.subject} | {assistant.class_name} </h2>
              <p className="text-left text-sm text-ellipsis">{assistant.about}</p>
              <p className="text-left text-xs text-gray-500">Last updated: {moment(assistant.updated_at).fromNow()}</p>
            </div>
          ))}
        </div>
        {showPopup && (
          <div className="modal text-base">
            <div className="modal-content" ref={popupRef}>
              <span className="close" onClick={handleClosePopup}>&times;</span>
              <h2 className="modal-title text-slate-800 text-center mb-4">Create Assistant</h2>
              <div className="modal-label text-slate-800 text-left">  
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
              </div>
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

              
              <h3 className="text-sm font-bold text-slate-500 text-left">Connected Channels:</h3>
              {Object.entries(teacherInfo.channels).map(([key, channel]) => (
                channel?.profile?.is_connected && (
                <div className="modal-label text-slate-800 text-left flex flex-row">
                  <input type="checkbox" name={key} className='w-2/12 accent-teal-600'  value={channel?._id}  />
                  <p className='ml-2 w-10/12'>{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                </div>
                )
              ))}

              {uploadProgress > 0 && <progress value={uploadProgress} max="100">{uploadProgress}%</progress>}
              <button onClick={handleCreateAssistant} className="modal-button w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-md">Create Assistant</button>
            </div>
          </div>
        )}

        {showWAPopup && (
          <div className="modal text-base">
            <div className="modal-content" ref={popupRef}>
              <span className="close" onClick={() => setShowWAPopup(false)}>&times;</span>
              <h2 className="modal-title text-slate-800 text-center mb-4">Connect WhatsApp</h2>
              <label className="modal-label text-slate-800 text-left">
                WhatsApp Number:
                <input type="text" name="phone_number" value={teacherInfo.channels?.whatsapp?.profile?.phone_number} onChange={handleWAInputChange} className="w-full p-2 border border-teal-600 outline-teal-600 rounded-md" />
              </label>
              <label className="modal-label text-slate-800 text-left">
                App Id:
                <input type="text" name="app_id" value={teacherInfo.channels?.whatsapp?.profile?.app_id} onChange={handleWAInputChange} className="w-full p-2 border border-teal-600 outline-teal-600 rounded-md" />
              </label>
              <label className="modal-label text-slate-800 text-left">
                App Secret:
                <input type="text" name="app_secret" value={teacherInfo.channels?.whatsapp?.profile?.app_secret} onChange={handleWAInputChange} className="w-full p-2 border border-teal-600 outline-teal-600 rounded-md" />
              </label>
              <label className="modal-label text-slate-800 text-left">
                Access Token:
                <input type="text" name="access_token" value={teacherInfo.channels?.whatsapp?.profile?.access_token} onChange={handleWAInputChange} className="w-full p-2 border border-teal-600 outline-teal-600 rounded-md" />
              </label>
              
              <button className="modal-button w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-md" onClick={hasWhatsApp ? handleEditWA : handleConnectWA}>{hasWhatsApp ? 'Edit' : 'Connect'} WhatsApp</button>
            </div>
          </div>
        )}

        {showTelegramPopup && (
          <div className="modal text-base">
            <div className="modal-content" ref={popupRef}>
              <span className="close" onClick={handleCloseTelegramPopup}>&times;</span>
              <h2 className="modal-title text-slate-800 text-center mb-4">Connect Telegram</h2>
              <label className="modal-label text-slate-800 text-left">
                Telegram Username:
                <input type="text" name="username" value={telegramUsername} onChange={(e) => setTelegramUsername(e.target.value)} className="w-full p-2 border border-teal-600 outline-teal-600 rounded-md" />
              </label>
              <label className="modal-label text-slate-800 text-left">
                Access Key:
                <input type="text" name="access_key" value={telegramAccessKey} onChange={(e) => setTelegramAccessKey(e.target.value)} className="w-full p-2 border border-teal-600 outline-teal-600 rounded-md" />
              </label>
              <button className="modal-button w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-md" onClick={teacherInfo.channels?.telegram?.profile?.is_connected ? handleEditTelegram : handleConnectTelegram}>
                {teacherInfo.channels?.telegram?.profile?.is_connected ? 'Edit' : 'Connect'} Telegram
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
