import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './Welcome';
import './App.css';
import TeacherDashboard from './teacher';
import Assistant from './assistant'; // Import the Assistant component

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/teacher-redirect" element={<div>Teacher Redirect</div>} />
            <Route path="/student-redirect" element={<div>Student Redirect</div>} />
            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
            <Route path="/student-dashboard" element={<div>Student Dashboard</div>} />
            <Route path="/assistant/:id" element={<Assistant />} /> {/* New route */}
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
