import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Chat.css';

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

  useEffect(() => {
    if (currentConversationId) {
      fetchConversation(currentConversationId);
    }
  }, [assistant_id, currentConversationId]);

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

  return (
    <div className="chat-container w-full">
      <div className="chat-section">
        <div className="chat-header">
          <select>
            {/* Populate with previous conversations */}
          </select>
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
    </div>
  );
};

export default Chat;
