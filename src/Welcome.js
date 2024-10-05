import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { API_URL } from './config';

const Welcome = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = async (response, userType) => {
    console.log('Login Success:', response);
    const googleToken = response.credential;

    const url = userType === 'teacher' ? '/verify-teacher' : '/verify-student';
    const redirectPath = userType === 'teacher' ? '/teacher' : '/student';

    try {
      const res = await fetch(`${API_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${googleToken}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to verify user');
      }

      const data = await res.json();
      console.log('JWT Token:', data.jwt_token);
      // Store the JWT token in local storage or context
      localStorage.setItem('jwt_token', data.jwt_token);

      navigate(redirectPath);
    } catch (error) {
      console.error('Error verifying user:', error);
    }
  };

  const handleLoginFailure = (response) => {
    console.log('Login Failed:', response);
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || '85855602562-ah91c2s403kvjm44gheh5aqh260beik2.apps.googleusercontent.com'}>
      <div className="flex flex-col items-center justify-center min-h-screen w-full text-black bg-gray-100">
        <h1 className="text-4xl font-bold mb-8">Welcome to BamanAI</h1>
        <h3 className="text-xxl mb-8">Attention tutors and coaches!! Now you can guide ALL your students ALWAYS. </h3>
        <p className="text-xl mb-8 px-16">BamanAI allows you to create your own AI assistant who will be available 24/7 to your students on WhatsApp, Telegram, Instagram and Facebook. You can use BamanAI to help you with your students' questions, assignments, and more.</p>

        {/* <p className="text-m mt-16 mb-8 text-neutral-800">Choose your role below.</p> */}
        <div className="flex w-full justify-between px-16">
          <div className="flex flex-col items-center w-1/2 px-16">
            <h2 className="text-2xl font-semibold mb-4">Join as Teacher</h2>
            <GoogleLogin
              onSuccess={(response) => handleLoginSuccess(response, 'teacher')}
              onError={handleLoginFailure}
              useOneTap
              className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
            >
              Join as Teacher
            </GoogleLogin>
          </div>
          <div className="flex flex-col items-center w-1/2 px-16">
            <h2 className="text-2xl font-semibold mb-4">Join as Student</h2>
            <GoogleLogin
              onSuccess={(response) => handleLoginSuccess(response, 'student')}
              onError={handleLoginFailure}
              useOneTap
              className="bg-green-500 text-white font-bold py-2 px-4 rounded"
            >
              Join as Student
            </GoogleLogin>
          </div>
        </div>
        <footer className="absolute bottom-0 w-full text-center py-4 bg-gray-100">
          <p className="text-sm text-gray-600">
            An <a href="https://github.com/brahmalabs/baman-ai" target="_blank" className="text-teal-600">Open Source</a> Experiment by <img src="https://brahma-labs.com/img/logo-royal-blue.png" alt="Brahma Labs" className="inline h-4 mx-1" /> <a href='https://brahma-labs.com' target="_blank" className='text-teal-600'>Brahma Labs</a>
          </p>
        </footer>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Welcome;