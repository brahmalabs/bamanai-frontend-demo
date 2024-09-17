import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import './Assistant.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faAngleDown, faTrash, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
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

  if (!assistant) {
    return <div>Loading...</div>;
  }

  return (
    <div className="assistant-container text-slate-800">
      <div className='flex flex-row justify-between w-full border-b-2 border-teal-600 pb-2 pl-4 pt-2'>
        <h1 className="text-2xl font-bold text-left">
          <span onClick={() => navigate('/')} className='border-b-2 border-teal-600 hover:cursor-pointer'> BamanAI </span> / 
          <span onClick={() => navigate('/teacher')} className='border-b-2 border-teal-600 hover:cursor-pointer'> Assistants</span> / 
          <span className="text-teal-600"> {assistant.id} </span>
        </h1>
        <div className='flex flex-row bg-teal-200 rounded-full p-1 me-4'>
          <img src={assistant.profile_picture || 'https://robohash.org/bamanai'} className='w-7 h-7 rounded-full hover:cursor-pointer' onClick={() => navigate('/teacher')} />
          <FontAwesomeIcon icon={faAngleDown} className='w-4 h-4 rounded-full hover:cursor-pointer align-baseline pt-2' onClick={() => navigate('/teacher')} />
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
              <div key={index} className="file-card bg-gray-100 border border-gray-300 rounded-md p-2">
                <p className="file-title font-bold">{file.title}</p>
                <p className="file-content">{file.content.substring(0, 100)}...</p>
                <p className="file-summary">{file.short_summary}</p>
                <p className="file-url">{file.fileUrl}</p>
                <p className="file-digests">Digests: {file.digests.length}</p>
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
          <p className='text-lg text-teal-600' >{assistant.subject} | {assistant.class_name} <FontAwesomeIcon icon={faEdit}  className='w-4 h-4 rounded-full hover:cursor-pointer align-baseline ps-2' /></p>
          <p className='text-sm text-slate-500'>{assistant.about || "No about text added..."}</p>
        </div>
        <div className="social-icons flex flex-col w-2/12">

        </div>
      </div>
    </div>
  );
};

export default Assistant;
