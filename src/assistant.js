import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Assistant.css';

const Assistant = () => {
  const { id } = useParams();
  const [assistant, setAssistant] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [students, setStudents] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [progress, setProgress] = useState({ uploaded: 0, total: 0, digested: 0, totalDigests: 0 });
  const [showOwnContent, setShowOwnContent] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState(null);

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
    setStudents([...students, studentId]);
    setStudentId('');
  };

  const handleDigest = async (otype) => {
    console.log(otype);
    const fileInput = document.querySelector('.upload-input[type="file"]');
    const urlInput = document.querySelector('.upload-input[type="text"]');
    const files = fileInput.files;
    const urls = urlInput.value.split(/[\n,]+/).map(url => url.trim()).filter(url => url);

    const totalFiles = files.length + urls.length;
    setProgress({ uploaded: 0, total: totalFiles, digested: 0, totalDigests: totalFiles });

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      const blob = new Blob([files[i]], { type: files[i].type });
      formData.set('files', blob, files[i].name);

      const response = await fetch('http://localhost:8888/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if(!data.success || data.file == null) continue;
      const fileUrls = data.file;

      for (let fileUrl of fileUrls) {
        await digestFile(fileUrl, otype);
      }

      setProgress(prev => ({ ...prev, uploaded: prev.uploaded + 1 }));
    }

    for (let url of urls) {
      await digestFile(url, otype);
      setProgress(prev => ({ ...prev, uploaded: prev.uploaded + 1 }));
    }
  };

  const digestFile = async (fileUrl, otype) => {
    const response = await fetch('http://127.0.0.1:5000/digest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: JSON.stringify({ fileUrl, assistant_id: id, content_type: otype })
    });
    const data = await response.json();
    setUploadedFiles(prev => [...prev, data.content]);
    setProgress(prev => ({ ...prev, digested: prev.digested + 1 }));
  };

  const handleContentClick = (content) => {
    setPopupContent(content);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupContent(null);
  };

  if (!assistant) {
    return <div>Loading...</div>;
  }

  return (
    <div className="assistant-container">
      <div className="top-section">
        <div className="left-section">
          <div className="left-top">
            <input type="file" multiple className="upload-input mb-1" />
            <p className="text-sm text-gray-500 mb-1">or</p>
            <input type="text" className="upload-input mb-1 w-full" placeholder="Enter Youtube or File URL" />
            <div className="digest-buttons">
              <button className="upload-button" onClick={() => handleDigest('own')}>Digest (Own Content)</button>
              <button className="upload-button" onClick={() => handleDigest('supporting')}>Digest (Supporting Content)</button>
            </div>
            <p className="progress-text">Uploaded {progress.uploaded}/{progress.total} files, Digested {progress.digested}/{progress.totalDigests} files</p>
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
          <div className="tab-switcher">
            <button onClick={() => { setShowOwnContent(true); setUploadedFiles(assistant.own_content); }}>Own Content</button>
            <button onClick={() => { setShowOwnContent(false); setUploadedFiles(assistant.supporting_content); }}>Supporting Content</button>
          </div>
          <div className="uploaded-files">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="file-card text-left text-black" onClick={() => handleContentClick(file)}>
                <p className="file-title">{file.title}</p>
                <p className="file-content">{file.content.substring(0, 100)}...</p>
                <p className="file-summary">{file.short_summary}</p>
                <p className="file-url">{file.fileUrl}</p>
                <p className="file-digests">Digests: {file.digests.length}</p>
              </div>
            ))}
          </div>
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
      {showPopup && (
        <div className="popup-overlay text-black" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closePopup}>Close</button>
            <h2>{popupContent.title}</h2>
            <p>{popupContent.content.substring(0, 100)}...</p>
            <p>{popupContent.short_summary}</p>
            <p>{popupContent.fileUrl}</p>
            <div className="digests">
              {popupContent.digests.map((digest, index) => (
                <div key={index} className="digest-card">
                  <p className="digest-title">{digest.title}</p>
                  <p className="digest-content">{digest.content.substring(0, 100)}...</p>
                  <p className="digest-summary">{digest.short_summary}</p>
                  <p className="digest-questions">{digest.questions.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assistant;
