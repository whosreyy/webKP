import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data);
        navigate('/');
      } else {
        // Menampilkan pesan error dari server (Username atau Password Salah)
        setError(data.message || 'Login gagal, silakan cek kembali.');
      }
    } catch (err) {
      setError('Koneksi ke server gagal. Pastikan server sudah dijalankan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f9ff' }}>
      <div className="card" style={{ padding: '40px', width: '400px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '8px', color: 'var(--primary-dark)', fontWeight: '900' }}>ERABLUE POS</h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '32px', fontSize: '14px' }}>Silakan masuk untuk mengelola toko</p>
        
        {/* Notifikasi Error */}
        {error && (
          <div style={{ 
            background: '#fee2e2', 
            color: '#b91c1c', 
            padding: '12px 16px', 
            borderRadius: '12px', 
            marginBottom: '20px', 
            fontSize: '13px', 
            fontWeight: '600',
            border: '1px solid #fecaca',
            textAlign: 'center',
            animation: 'shake 0.5s ease-in-out'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Username</label>
            <input 
              type="text" 
              className="input-group" 
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Ketik username Anda"
            />
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#475569' }}>Password</label>
            <input 
              type="password" 
              className="input-group" 
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: '800' }}
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>
      </div>

      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .input-group:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px var(--primary-light); }
        `}
      </style>
    </div>
  );
};

export default Login;
