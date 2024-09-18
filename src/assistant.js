import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import './Assistant.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faAngleDown, faTrash, faInfoCircle, faLink, faDownload } from '@fortawesome/free-solid-svg-icons';
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';

const Assistant = () => {
  const { id } = useParams();
  const [assistant, setAssistant] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [students, setStudents] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileUrls, setFileUrls] = useState('');
  const [progress, setProgress] = useState({ digested: 0, totalDigests: 0 });
  const [showOwnContent, setShowOwnContent] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [buttonText, setButtonText] = useState('Digest');
  const navigate = useNavigate();
  const [isDigesting, setIsDigesting] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editClassName, setEditClassName] = useState('');
  const [editAbout, setEditAbout] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const editPopupRef = useRef(null);

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
      setUploadedFiles(data.assistant.own_content);
    })
    .catch(error => {
      console.error('Error fetching assistant:', error);
    });
  }, [id]);

  const handleAddStudent = () => {
    if (studentId && studentId !== '' && assistant) {
      fetch('http://127.0.0.1:5000/add_student_to_assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ student_id: studentId, assistant_id: id })
      })
      .then(response => response.json())
      .then(data => {
        if (data.message) {
          setStudents([...students, studentId]);
          setStudentId('');
          toastr.success('Student added successfully');
        } else {
          toastr.error('Error adding student:', data.error);
        }
      })
      .catch(error => {
        console.error('Error adding student:', error);
      });
    }
  };

  const handleRemoveStudent = (student) => {
    fetch('http://127.0.0.1:5000/remove_student_from_assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: JSON.stringify({ student_id: student, assistant_id: id })
    })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        setStudents(students.filter(s => s !== student));
        toastr.success('Student removed successfully');
      } else {
        toastr.error('Error removing student:', data.error);
      }
    })
    .catch(error => {
      setStudents(students.filter(s => s !== student));
      toastr.error('Error removing student:', error);
    });
  };

  const handleDigest = async () => {
    const urls = fileUrls.split('\n').map(url => url.trim()).filter(url => url);
    setProgress({ digested: 0, totalDigests: urls.length });
    setButtonText(`Digesting... 0/${urls.length}`);
    setIsDigesting(true);

    for (let i = 0; i < urls.length; i++) {
      await digestFile(urls[i]);
      setProgress(prev => ({ ...prev, digested: prev.digested + 1 }));
      setButtonText(`Digesting... ${i + 1}/${urls.length}`);
    }

    setButtonText('Digest');
    setIsDigesting(false);
  };

  const digestFile = async (fileUrl) => {
    const response = await fetch('http://127.0.0.1:5000/digest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: JSON.stringify({ fileUrl, assistant_id: id, content_type: showOwnContent ? 'own' : 'supporting' })
    });
    const data = await response.json();
    setUploadedFiles(prev => [...prev, data.content]);
    if (data.content.digests) {
      toastr.success('File digested successfully');
    } else {
      toastr.error('Error digesting file:', data.error);
    }
  };

  const handleDeleteFile = (contentId) => {
    fetch('http://127.0.0.1:5000/delete_file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: JSON.stringify({ assistant_id: id, content_id: contentId, content_type: showOwnContent ? 'own' : 'supporting' })
    })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        setUploadedFiles(uploadedFiles.filter(file => file._id !== contentId));
        toastr.success('File deleted successfully');
        setPopupContent(null);
        setShowPopup(false);
      } else {
        toastr.error('Error deleting file:', data.error);
      }
    })
    .catch(error => {
      console.error('Error deleting file:', error);
      toastr.error('Error deleting file:', error);
    });
  };

  const onDrop = (acceptedFiles) => {
    acceptedFiles.forEach(file => {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('files', file);

      fetch('http://localhost:8888/upload', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success && data.file) {
          setFileUrls(prev => prev + data.file[0] + '\n');
        }
      })
      .catch(error => {
        console.error('Error uploading file:', error);
      })
      .finally(() => {
        setIsUploading(false);
      });
    });
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleEditAssistant = () => {
    setEditSubject(assistant.subject);
    setEditClassName(assistant.class_name);
    setEditAbout(assistant.about);
    setEditImageUrl(assistant.profile_picture);
    setShowEditPopup(true);
  };

  const handleEditImageDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('files', file);

    fetch('http://localhost:8888/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.file) {
        setEditImageUrl(data.file[0]);
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

  const { getRootProps: getEditImageRootProps, getInputProps: getEditImageInputProps } = useDropzone({ onDrop: handleEditImageDrop });

  const handleSaveEdit = () => {
    fetch(`http://127.0.0.1:5000/edit_assistant/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: JSON.stringify({
        subject: editSubject,
        class_name: editClassName,
        about: editAbout,
        profile_picture: editImageUrl
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        setAssistant(prev => ({
          ...prev,
          subject: editSubject,
          class_name: editClassName,
          about: editAbout,
          profile_picture: editImageUrl
        }));
        setShowEditPopup(false);
        toastr.success('Assistant updated successfully');
      } else {
        toastr.error('Error updating assistant:', data.error);
      }
    })
    .catch(error => {
      console.error('Error updating assistant:', error);
      toastr.error('Error updating assistant');
    });
  };

  const handleContentClick = (content) => {
    setPopupContent(content);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupContent(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editPopupRef.current && !editPopupRef.current.contains(event.target)) {
        setShowEditPopup(false);
      }
    };

    if (showEditPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEditPopup]);

  if (!assistant) {
    return <div>Loading...</div>;
  }

  return (
    <div className="assistant-container text-slate-800 w-full">
      <div className='flex flex-row justify-between w-full border-b-2 border-teal-600 pb-2 pl-4 pt-2'>
        <h1 className="text-2xl font-bold text-left">
          <span onClick={() => navigate('/')} className='border-b-2 border-teal-600 hover:cursor-pointer'> BamanAI </span> / 
          <span onClick={() => navigate('/teacher')} className='border-b-2 border-teal-600 hover:cursor-pointer'> Assistants</span> / 
          <span className="text-teal-600"> {assistant.id} </span>
        </h1>
        <div className='flex flex-row bg-teal-200 rounded-full p-1 me-4'>
          <img src={assistant.profile_picture || 'https://robohash.org/bamanai'} className='w-7 h-7 rounded-full hover:cursor-pointer' onClick={() => navigate('/teacher')} />
          <FontAwesomeIcon icon={faAngleDown} className='w-4 h-4 rounded-full hover:cursor-pointer align-baseline pt-2' onClick={() => navigate('/teacher')} />
          <FontAwesomeIcon icon={faEdit} className='w-4 h-4 rounded-full hover:cursor-pointer align-baseline pt-2' onClick={handleEditAssistant} />
        </div>
      </div>
      <div className="top-section">
        <div className="left-section">
          <div className="left-top h-1/3 border-b-2 border-teal-600 pb-2">
            <h3 className='text-xl font-bold text-left'>
              Upload {showOwnContent ? 'Own' : 'Supporting'} Files (Max 100MB) 
              <div className='tooltip'>
              <FontAwesomeIcon 
                icon={faInfoCircle} 
                className='w-4 h-4 rounded-full hover:cursor-pointer align-baseline pt-2' 
              />
              <div className="tooltiptext text-sm">
                  {showOwnContent ? "Own files are the personal creations of a teacher that is used by AI to also create personality os the assitant besides being used for answering questions. Files can be self written notes, videos etc." : "Supporting files are files that are used to answer questions. These are not personal creations of the teacher. File can be textbook, articles, other videos etc."}
              </div>
              </div>
            </h3>
            <div {...getRootProps({ className: 'dropzone border-2 border-dashed border-teal-600 rounded-md p-4 mb-2 h-2 text-sm p-0' })}>
              <input {...getInputProps()} />
              <p>Drag 'n' drop some files here, or click to select files</p>
            </div>
            {isUploading? <p className='text-sm text-teal-600'>Uploading...</p> : <p className='text-sm text-teal-600'> or enter file URLs below separated by new lines</p>}
            <textarea
              className="upload-input text-sm mb-1 w-full border border-teal-600 rounded-md p-2"
              value={fileUrls}
              onChange={(e) => setFileUrls(e.target.value)}
              placeholder="Enter file URLs here, one per line"
            />
            <div className="digest-buttons flex gap-4">
              <button
                className="upload-button bg-teal-600 text-white rounded-md p-1 text-base w-4/5 m-auto hover:bg-teal-700"
                onClick={handleDigest}
                disabled={isDigesting}
              >
                {buttonText}
              </button>
            </div>
          </div>
          <div className="left-bottom h-2/3 pt-4">
            <div className='flex flex-row justify-between'>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter Student ID"
                className="w-3/4 h-10 text-sm border p-2 outline-teal-600 focus:border-teal-800 rounded-md"
              />
              <button onClick={handleAddStudent} className="bg-teal-600 h-10 text-sm text-white rounded-md ms-2 w-1/4">Add Student</button>
            </div>
            <ul className='list-none p-0 mt-2'>
              {students.map((student, index) => (
                <li key={index} className='text-sm text-teal-600 flex flex-row justify-between'>{student} <FontAwesomeIcon icon={faTrash} className='w-4 h-4 rounded-full hover:cursor-pointer align-baseline pt-2' onClick={() => handleRemoveStudent(student)} /></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="right-section">
          <div className="tab-switcher flex justify-around p-2 border-b border-gray-300 rounded-t-md">
            <button
              className={`border-2 border-teal-600 w-1/2 p-2 rounded-l-md ${showOwnContent ? 'bg-teal-600 text-white' : 'text-slate-800'}`}
              onClick={() => { setShowOwnContent(true); setUploadedFiles(assistant.own_content); }}
            >
              Own Content
            </button>
            <button
              className={`border-2 border-teal-600 w-1/2 p-2 rounded-r-md ${!showOwnContent ? 'bg-teal-600 text-white' : 'text-slate-800'}`}
              onClick={() => { setShowOwnContent(false); setUploadedFiles(assistant.supporting_content); }}
            >
              Supporting Content
            </button>
          </div>
          <div className="uploaded-files flex flex-col gap-2 p-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="text-left text-slate-800file-card bg-gray-100 border border-gray-300 rounded-md p-2 hover:cursor-pointer" onClick={() => handleContentClick(file)}>
                <p className="text-lg font-bold">{file.title}</p>
                <p className="text-sm text-slate-500">{file.content.substring(0, 100)}...</p>
                <p className="text-sm mt-1">{file.short_summary}</p>
                <p className="file-url text-sm text-slate-500"> <FontAwesomeIcon icon={faLink} className='' /> {file.fileUrl}</p>
                {/* <FontAwesomeIcon icon={faTrash} className='w-4 h-4 rounded-full hover:cursor-pointer align-baseline pt-2' onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }} /> */}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bottom-section flex justify-between items-center p-4 border-t border-gray-300">
        <div className='flex flex-col w-1/12'>
          <img src={assistant.profile_picture || 'https://robohash.org/bamanai'} className='w-20 h-20 rounded-full' />
        </div>
        <div className='flex flex-col text-left w-9/12'>
          <p className='text-lg text-teal-600' >{assistant.subject} | {assistant.class_name} <FontAwesomeIcon icon={faEdit}  className='w-4 h-4 rounded-full hover:cursor-pointer align-baseline ps-2' onClick={handleEditAssistant} /></p>
          <p className='text-sm text-slate-500'>{assistant.about || "No about text added..."}</p>
        </div>
        <div className="social-icons flex flex-col w-2/12">
            
        </div>
      </div>
      {showEditPopup && (
        <div className="modal">
          <div className="modal-content" ref={editPopupRef}>
            <span className="close" onClick={() => setShowEditPopup(false)}>&times;</span>
            <h2 className="modal-title text-slate-800 text-center mb-4">Edit Assistant</h2>
            <label className="modal-label text-slate-800 text-left">  
              Profile Picture:
              <div {...getEditImageRootProps({ className: 'dropzone' })} className="dropzone border-2 border-teal-600 rounded-md p-4">
                <input {...getEditImageInputProps()} />
                {editImageUrl ? (
                  <div className="uploaded-image">
                    <img src={editImageUrl} className="w-1/2 max-h-20 max-w-20 m-auto" alt="Uploaded" />
                    <FontAwesomeIcon icon={faEdit} className="edit-icon" />
                  </div>
                ) : (
                  <p>Drag 'n' drop an image here, or click to select one</p>
                )}
              </div>
            </label>
            <label className="modal-label text-slate-800 text-left">
              Subject:
              <input type="text" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full p-2 border border-teal-600 outline-teal-600 rounded-md" />
            </label>
            <label className="modal-label text-slate-800 text-left">
              Class Name:
              <input type="text" value={editClassName} onChange={(e) => setEditClassName(e.target.value)} className="w-full p-2 border border-teal-600 outline-teal-600 rounded-md" />
            </label>
            <label className="modal-label text-slate-800 text-left">
              About:
              <textarea value={editAbout} onChange={(e) => setEditAbout(e.target.value)} className="w-full p-2 border border-teal-600 outline-teal-600 rounded-md" />
            </label>
            <button onClick={handleSaveEdit} className="bg-teal-600 text-white rounded-md p-2 mt-4 w-full hover:bg-teal-700">Save</button>
          </div>
        </div>
      )}

      {showPopup && (
        <div className="popup-overlay text-slate-800" onClick={closePopup}>
          <div className="popup-content text-left" onClick={(e) => e.stopPropagation()}>
            <button className="close-button-a bg-slate-600 rounded-full w-6 h-6 p-0 m-0 text-center text-base text-white hover:bg-slate-500" onClick={closePopup}> X </button>
            <h2 className='text-xl font-bold'>{popupContent.title}</h2>
            <h3 className='text-base text-slate-500 text-bold mt-2'>Full Content</h3>
            <p className='text-sm '>{popupContent.content}</p>
            <h3 className='text-base text-slate-500 text-bold mt-2'>Short Summary</h3>
            <p className='text-sm text-slate-500'>{popupContent.short_summary}</p>
            <h3 className='text-base text-slate-500 text-bold mt-2'>Long Summary</h3>
            <p className='text-sm text-slate-500'>{popupContent.long_summary}</p>
            <h3 className='text-base text-slate-500 text-bold mt-2'>Topics</h3>
            <p className='text-sm text-slate-500'>{popupContent.topics.join(', ')}</p>
            <h3 className='text-base text-slate-500 text-bold mt-2'>Keywords</h3>
            <p className='text-sm text-slate-500'>{popupContent.keywords.join(', ')}</p>
            {popupContent.questions && (
              <>
                <h3 className='text-base text-slate-500 text-bold mt-2'>Questions</h3>
                <p className='text-sm text-slate-500'>{popupContent.questions.join(', ')}</p>
              </>
            )}
            <h3 className='text-base text-slate-500 text-bold mt-2'>File URL</h3>
            <p className='text-sm text-slate-500'>
              {popupContent.fileUrl} 
              <a href={popupContent.fileUrl} className='ms-2' download>
                <FontAwesomeIcon icon={faDownload} className='rounded-full hover:cursor-pointer align-baseline' />
              </a>
            </p>
            <h3 className='text-base text-slate-500 text-bold mt-2'>Digests</h3>
            <div className="digests">
              {popupContent.digests.map((digest, index) => (
                <div key={index} className="digest-card">
                  <p className="digest-title">{digest.title}</p>
                  <h3 className='text-base text-slate-500 text-bold mt-2'>FullContent</h3>
                  <p className="digest-content">{digest.content}</p>
                  <h3 className='text-base text-slate-500 text-bold mt-2'>Summary</h3>
                  <p className="digest-summary">{digest.short_summary}</p>
                  <h3 className='text-base text-slate-500 text-bold mt-2'>Topics</h3>
                  <p className='text-sm text-slate-500'>{digest.topics.join(', ')}</p>
                  <h3 className='text-base text-slate-500 text-bold mt-2'>Keywords</h3>
                  <p className='text-sm text-slate-500'>{digest.keywords.join(' , ')}</p>
                  {digest.questions && (
                    <>
                      <h3 className='text-base text-slate-500 text-bold mt-2'>Questions</h3>
                      <p className="digest-questions">{digest.questions.join(' , ')}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => handleDeleteFile(popupContent._id)} className="bg-red-600 text-white rounded-md p-2 mt-4 w-full hover:bg-red-700">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assistant;
