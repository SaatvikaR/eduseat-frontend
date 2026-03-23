import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '48px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center', minWidth: '380px'
      }}>
        <h1 style={{ color: '#1a237e', fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>
          Edu Seat
        </h1>
        <p style={{ color: '#666', marginBottom: '32px', fontSize: '1rem' }}>
          Exam Seating Management System
        </p>
        <button onClick={() => navigate('/login')} style={{
          width: '100%', padding: '14px', background: '#1a237e',
          color: 'white', border: 'none', borderRadius: '8px',
          fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginBottom: '12px'
        }}>
          Staff Portal
        </button>
        <button onClick={() => navigate('/student')} style={{
          width: '100%', padding: '14px', background: 'white',
          color: '#1a237e', border: '2px solid #1a237e', borderRadius: '8px',
          fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
        }}>
          Student Portal
        </button>
      </div>
    </div>
  );
}