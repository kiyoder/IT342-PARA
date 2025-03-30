import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './auth/Register';
import Login from './auth/Login';

function App() {
  return (
      <Router>
        <div className="App">
          <Routes>
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </Router>
  );
}

function Home() {
  return <h2>Home</h2>;
}

export default App;