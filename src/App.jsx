import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import StaffPortal from './pages/StaffPortal';
import StudentPortal from './pages/StudentPortal';

function ProtectedRoute({ children }) {
  const isAuth = localStorage.getItem('eduseat_auth') === 'true';
  return isAuth ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/staff" element={
          <ProtectedRoute>
            <StaffPortal />
          </ProtectedRoute>
        } />
        <Route path="/student" element={<StudentPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;