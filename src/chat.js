import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Chat.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown, faEdit, faArrowLeft, faPlus } from '@fortawesome/free-solid-svg-icons';

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
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender}`}>
              {msg.content}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input text-black">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
      <div className="reference-section">
        <div className="tab-switcher">
          <button onClick={() => setShowOwnContent(true)}>Own Content</button>
          <button onClick={() => setShowOwnContent(false)}>Supporting Content</button>
        </div>
        <div className="references">
          {showOwnContent ? (
            ownReferences.map((ref, index) => (
              <div key={index} className="reference-card" onClick={() => handleReferenceClick(ref)}>
                <h3>{ref.title}</h3>
                <p>{ref.short_summary}</p>
              </div>
            ))
          ) : (
            supportedReferences.map((ref, index) => (
              <div key={index} className="reference-card" onClick={() => handleReferenceClick(ref)}>
                <h3>{ref.title}</h3>
                <p>{ref.short_summary}</p>
              </div>
            ))
          )}
        </div>
      </div>
      {showPopup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closePopup}>Close</button>
            <h2>{popupContent.title}</h2>
            <p>{popupContent.content}</p>
          </div>
        </div>
      )}
      {showSidebar && (
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
      )}
    </div>
    </>
  );
};

export default Chat;
