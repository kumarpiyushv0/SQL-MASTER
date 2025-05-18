import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SchemaViewer from './pages/SchemaViewer';
import SchemaCreator from './pages/SchemaCreator';
import LoginPage from './pages/Login';
import RegisterPage from './pages/RegisterPage';


function App() {
  return (
    <Router>
      <div className="app-container">
        <header>
          <h1>SQL MASTER</h1>
          <nav className="nav">
            <Link to="/">View Schemas</Link>
            <Link to="/create">Create Schema</Link>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<SchemaViewer />} />
            <Route path="/create" element={<SchemaCreator />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

