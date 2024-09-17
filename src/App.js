import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Welcome from './Welcome';
import './App.css';
import TeacherDashboard from './teacher';
import Assistant from './assistant'; // Import the Assistant component
import StudentDashboard from './student';
import Chat from './chat'; // Assuming you have a Chat component

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header bg-teal-50">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/teacher-redirect" element={<div>Teacher Redirect</div>} />
            <Route path="/student-redirect" element={<div>Student Redirect</div>} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/assistant/:id" element={<Assistant />} /> {/* New route */}
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/chat/:assistant_id" element={<Chat />} />
            <Route path="/chat/:assistant_id/:conversation_id" element={<Chat />} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
