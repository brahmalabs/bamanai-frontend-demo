import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Chat.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown, faEdit, faArrowLeft, faPlus, faFileAlt, faCopy, facli, faClipboard, faUpload, faDownload } from '@fortawesome/free-solid-svg-icons';
import toastr from 'toastr';

const Chat = () => {
  const { assistant_id, conversation_id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [ownReferences, setOwnReferences] = useState([]);
  const [supportedReferences, setSupportedReferences] = useState([]);
  const [showOwnContent, setShowOwnContent] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const chatEndRef = useRef(null);
  const [currentConversationId, setCurrentConversationId] = useState(conversation_id || null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [assistantData, setAssistantData] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    getStudentInfo();
    getAssistantData();
    fetchConversations();
    if (currentConversationId) {
      setMessages([]);
      setOwnReferences([]);
      setSupportedReferences([]);
      setShowSidebar(false);
      fetchConversation(currentConversationId);
    }
  }, [currentConversationId, assistant_id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setShowSidebar(false);
      }
    };

    if (showSidebar) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSidebar]);

  const getStudentInfo = async () => {
    const response = await fetch('http://127.0.0.1:5000/get_student_info', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      }
    });
    const data = await response.json();
    setStudentInfo(data);
  };

  const getAssistantData = async () => {
    const response = await fetch(`http://127.0.0.1:5000/get_student_assistant/${assistant_id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      }
    });
    const data = await response.json();
    setAssistantData(data);
  };

  const fetchConversations = async () => {
    const response = await fetch(`http://127.0.0.1:5000/get_conversations/${assistant_id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      }
    });
    const data = await response.json();
    setConversations(data.conversations);
  };

  const fetchConversation = async (conversationId) => {
    const response = await fetch(`http://127.0.0.1:5000/get_conversation/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      }
    });
    const data = await response.json();
    if (data.error) {
      console.error('Error fetching conversation:', data.error);
    } else {
      setMessages(data.messages);
      setOwnReferences(data.references.own);
      setSupportedReferences(data.references.supported);
      scrollToBottom();
    }
  };

  const handleSendMessage = async () => {
    const response = await fetch('http://127.0.0.1:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      },
      body: JSON.stringify({ assistant_id, conversation_id: currentConversationId, message })
    });
    const data = await response.json();
    setMessages([...messages, { sender: 'user', content: message }, { sender: 'assistant', content: data.message }]);
    setOwnReferences(data.references.own);
    setSupportedReferences(data.references.supported);
    setMessage('');
    scrollToBottom();

    if (!currentConversationId && data.conversation_id) {
      setCurrentConversationId(data.conversation_id);
      navigate(`/chat/${assistant_id}/${data.conversation_id}`);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReferenceClick = (content) => {
    setPopupContent(content);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupContent(null);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setOwnReferences([]);
    setSupportedReferences([]);
    navigate(`/chat/${assistant_id}`);
  };

  const handleConversationClick = (conversationId) => {
    setCurrentConversationId(conversationId);
    navigate(`/chat/${assistant_id}/${conversationId}`);
  };

  const handleCopyClick = (content) => {
    navigator.clipboard.writeText(content);
    toastr.success('Copied to clipboard');
  };

  return (
    <>
    <div className='text-slate-800 flex flex-row justify-between w-full border-b-2 border-teal-600 pb-2 pl-4 pt-2'>
        <h1 className="text-2xl font-bold text-left">
          <span onClick={() => navigate('/')} className='border-b-2 border-teal-600 hover:cursor-pointer'> BamanAI </span> / 
          <span onClick={() => navigate('/student')} className='border-b-2 border-teal-600 hover:cursor-pointer'> Assistants</span> / 
          <span className="text-teal-600"> {assistantData?.id} </span>
        </h1>
        <div className='flex flex-row bg-teal-200 rounded-full p-1 me-4'>
          <img src={studentInfo?.profile_picture || 'https://robohash.org/bamanai'} className='w-7 h-7 rounded-full hover:cursor-pointer' onClick={() => navigate('/student')} />
          <FontAwesomeIcon icon={faAngleDown} className='w-4 h-4 rounded-full hover:cursor-pointer align-baseline pt-2' onClick={() => navigate('/student')} />
        </div>
    </div>
    <div className="chat-container w-full text-slate-800">
      
      <div className="chat-section">
        <div className="chat-header flex flex-row justify-between">
          <div onClick={() => setShowSidebar(true)} className="text-sm text-slate-500 hover:cursor-pointer border border-slate-500 rounded-full px-2 py-1"> <FontAwesomeIcon icon={faArrowLeft} /> Previous Conversations </div>
          <div onClick={handleNewConversation} className="text-base font-bold hover:cursor-pointer bg-teal-600 text-white rounded-md px-2 py-1"> <FontAwesomeIcon icon={faPlus} /> New Conversation </div>
        </div>
        <div className="chat-window">
          {messages.length === 0 ? (
            <div className="assistant-info text-center">
              <img src={assistantData?.profile_picture || 'https://robohash.org/bamanai'} alt="Assistant" className="w-24 h-24 rounded-full mx-auto" />
              <h2 className="text-2xl font-bold mt-4">{assistantData?.teacher}</h2>
              <p className="text-lg">( {assistantData?.subject} | {assistantData?.class_name} )</p>
              <p className="mt-2 text-slate-500 text-base">{assistantData?.about}</p>
              <p className="mt-4 text-teal-600">Welcome! How can I assist you today?</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`chat-message text-left text-slate-800 ${msg.sender == 'user' ? 'text-lg bg-teal-100' : 'text-base bg-slate-100' } `}>
                <p className='text-slate-500 text-sm font-bold mb-1'> {msg.sender == 'user' ? 'You' : assistantData?.teacher} </p>
                <p> {msg.content} </p>
                {msg.sender == 'assistant' && (
                  <div className='text-slate-500 text-sm font-bold mt-1 text-right hover:cursor-pointer'> <FontAwesomeIcon icon={faCopy} onClick={() => handleCopyClick(msg.content)} /> </div>
                )}
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input text-slate-800 text-base">
          <FontAwesomeIcon icon={faUpload} className='p-2 text-xl text-slate-500 hover:cursor-pointer' />
          <textarea
            value={message}
            className='w-full p-2 border border-slate-500 rounded-md'
            rows={1}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
      <div className="reference-section">
        <div className="tab-switcher">
          <button
            onClick={() => setShowOwnContent(true)}
            className={`w-1/2 p-2 rounded-l-md border-2 text-base font-bold border-teal-600 ${showOwnContent ? 'active text-white bg-teal-600' : ''}`}
          >
            Teacher's Content
          </button>
          <button
            onClick={() => setShowOwnContent(false)}
            className={`w-1/2 p-2 rounded-r-md border-2 text-base font-bold border-teal-600 ${!showOwnContent ? 'active text-white bg-teal-600' : ''}`}
          >
            Supporting Content
          </button>
        </div>
        <div className="references text-left overflow-scroll">
          {showOwnContent ? (
            ownReferences.map((ref, index) => (
              <div key={index} className="reference-card border border-slate-500 rounded-md p-2 m-2 hover:cursor-pointer" onClick={() => handleReferenceClick(ref)}>
                <h3 className='text-base text-slate-500 font-bold'>{ref.digest.title}</h3>
                <p className='text-sm text-slate-800'>{ref.digest.short_summary}</p>
                <p className='text-xs italic text-slate-500'>{ref.content.title}</p>
              </div>
            ))
          ) : (
            supportedReferences.map((ref, index) => (
              <div key={index} className="reference-card border border-slate-500 rounded-md p-2 m-2 hover:cursor-pointer" onClick={() => handleReferenceClick(ref)}>
                <h3 className='text-base text-slate-500 font-bold'>{ref.digest.title}</h3>
                <p className='text-sm text-slate-800'>{ref.digest.short_summary}</p>
                <p className='text-xs italic text-slate-500'>{ref.content.title}</p>
              </div>
            ))
          )}
        </div>
      </div>
      {showPopup && (
        <div className="popup-overlay text-slate-800" onClick={closePopup}>
          <div className="popup-content text-left" onClick={(e) => e.stopPropagation()}>
            <button className="close-button-a bg-slate-600 rounded-full w-6 h-6 p-0 m-0 text-center text-base text-white hover:bg-slate-500" onClick={closePopup}> X </button>
            <h2 className='text-xl  font-bold'>{popupContent.digest.title}</h2>
            <p className='text-sm font-bold text-slate-500 mt-2'>Short Summary <FontAwesomeIcon icon={faCopy} className='text-slate-500 float-right me-2 hover:cursor-pointer' onClick={() => handleCopyClick(popupContent.digest.short_summary)} /></p>
            <p className='text-base text-slate-800'>{popupContent.digest.short_summary}</p>
            <p className='text-sm font-bold text-slate-500 mt-2'>Long Summary <FontAwesomeIcon icon={faCopy} className='text-slate-500 float-right me-2 hover:cursor-pointer' onClick={() => handleCopyClick(popupContent.digest.long_summary)} /></p>
            <p className='text-base text-slate-800'>{popupContent.digest.long_summary}</p>
            <p className='text-sm font-bold text-slate-500 mt-2'>Topics <FontAwesomeIcon icon={faCopy} className='text-slate-500 float-right me-2 hover:cursor-pointer' onClick={() => handleCopyClick(popupContent.digest.topics.join(', '))} /></p>
            <p className='text-base text-slate-800'>{popupContent.digest.topics.join(', ')}</p>
            <p className='text-sm font-bold text-slate-500 mt-2'>Keywords <FontAwesomeIcon icon={faCopy} className='text-slate-500 float-right me-2 hover:cursor-pointer' onClick={() => handleCopyClick(popupContent.digest.keywords.join(', '))} /></p>
            <p className='text-base text-slate-800'>{popupContent.digest.keywords.join(', ')}</p>
            <p className='text-sm font-bold text-slate-500 mt-2'>Questions <FontAwesomeIcon icon={faCopy} className='text-slate-500 float-right me-2 hover:cursor-pointer' onClick={() => handleCopyClick(popupContent.digest.questions.join(', '))} /></p>
            <p className='text-base text-slate-800'>{popupContent.digest.questions.join(', ')}</p>
            <p className='text-sm font-bold text-slate-500 mt-2'>Full Text <FontAwesomeIcon icon={faCopy} className='text-slate-500 float-right me-2 hover:cursor-pointer' onClick={() => handleCopyClick(popupContent.digest.content)} /></p>
            <p className='text-base text-slate-800'>{popupContent.digest.content}</p>
            <h3 className='text-base mt-4 italic font-bold text-slate-500'>Original Full Content</h3>
            <h2 className='text-xl  font-bold'>{popupContent.content.title}</h2>
            <p className='text-sm text-slate-500'>
              {popupContent.content.fileUrl} 
              <a href={popupContent.content.fileUrl} className='ms-2' download>
                <FontAwesomeIcon icon={faDownload} className='rounded-full hover:cursor-pointer align-baseline' />
              </a>
            </p>
            <p className='text-sm font-bold text-slate-500 mt-2'>Short Summary <FontAwesomeIcon icon={faCopy} className='text-slate-500 float-right me-2 hover:cursor-pointer' onClick={() => handleCopyClick(popupContent.content.short_summary)} /></p>
            <p className='text-base text-slate-800'>{popupContent.content.short_summary}</p>
            <p className='text-sm font-bold text-slate-500 mt-2'>Long Summary <FontAwesomeIcon icon={faCopy} className='text-slate-500 float-right me-2 hover:cursor-pointer' onClick={() => handleCopyClick(popupContent.content.long_summary)} /></p>
            <p className='text-base text-slate-800'>{popupContent.content.long_summary}</p>
            <p className='text-sm font-bold text-slate-500 mt-2'>Topics <FontAwesomeIcon icon={faCopy} className='text-slate-500 float-right me-2 hover:cursor-pointer' onClick={() => handleCopyClick(popupContent.content.topics?.join(', ') || 'N/A')} /></p>
            <p className='text-base text-slate-800'>{popupContent.content.topics?.join(', ') || 'N/A'}</p>
            <p className='text-sm font-bold text-slate-500 mt-2'>Keywords <FontAwesomeIcon icon={faCopy} className='text-slate-500 float-right me-2 hover:cursor-pointer' onClick={() => handleCopyClick(popupContent.content.keywords?.join(', ') || 'N/A')} /></p>
            <p className='text-base text-slate-800'>{popupContent.content.keywords?.join(', ') || 'N/A' }</p>
            <p className='text-sm font-bold text-slate-500 mt-2'>Questions <FontAwesomeIcon icon={faCopy} className='text-slate-500 float-right me-2 hover:cursor-pointer' onClick={() => handleCopyClick(popupContent.content.questions?.join(', ') || 'N/A')} /></p>
            <p className='text-base text-slate-800'>{popupContent.content.questions?.join(', ') || 'N/A' }</p>
            <p className='text-sm font-bold text-slate-500 mt-2'>Full text <FontAwesomeIcon icon={faCopy} className='text-slate-500 float-right me-2 hover:cursor-pointer' onClick={() => handleCopyClick(popupContent.content.content)} /></p>
            <p className='text-base text-slate-800'>{popupContent.content.content}</p>
          </div>
        </div>
      )}
      {showSidebar && (
        <>
          <div ref={sidebarRef} className="fixed top-0 left-0 h-full w-1/3 bg-white shadow-lg z-50">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-base text-slate-500 font-bold mb-0">Previous Conversations</h2>
              <button onClick={() => setShowSidebar(false)} className=" mb-0 ms-2 rounded-full bg-slate-200 p-1 text-slate-500 hover:text-slate-700">X</button>
            </div>
            <div className="p-4">
              {conversations.map((conv) => (
                <div key={conv.id} className="p-2 text-base text-left hover:bg-gray-100 cursor-pointer" onClick={() => handleConversationClick(conv.id)}>
                  {conv.title}
                </div>
              ))}
            </div>
          </div>
          <div className="fixed top-0 left-0 w-full h-full bg-black opacity-50 z-40" onClick={() => setShowSidebar(false)}></div>
        </> 
      )}
    </div>
    </>
  );
};

export default Chat;
