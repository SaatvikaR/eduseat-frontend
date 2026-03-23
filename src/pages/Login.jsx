import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setError('');
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (username === 'ritadmin' && password === 'admin@rit123') {
        localStorage.setItem('eduseat_auth', 'true');
        navigate('/staff');
      } else {
        setError('❌ Invalid username or password');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '48px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: '380px'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px', background: '#1a237e',
            borderRadius: '16px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <span style={{ color: 'white', fontSize: '28px' }}>🎓</span>
          </div>
          <h2 style={{ color: '#1a237e', margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Edu Seat</h2>
          <p style={{ color: '#666', margin: '4px 0 0', fontSize: '14px' }}>Staff Portal Login</p>
        </div>

        {/* Form */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: '#333', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
            Username
          </label>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '12px 14px', border: '1.5px solid #e0e0e0',
              borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box',
              outline: 'none', transition: 'border 0.2s'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', color: '#333', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '12px 14px', border: '1.5px solid #e0e0e0',
              borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: '#ffebee', borderRadius: '8px',
            color: '#c62828', fontSize: '14px', marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', background: loading ? '#90a4ae' : '#1a237e',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        
      </div>

      <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '24px', fontSize: '13px' }}>
        Rajalakshmi Institute of Technology
      </p>
    </div>
  );
}