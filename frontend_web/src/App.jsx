import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Register from "./auth/Register";
import Login from "./auth/Login";
import Home from "./pages/Home";
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
            <Route path="/register" element={
                <ErrorBoundary>
                    <Register />
                </ErrorBoundary>
            } />

          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;