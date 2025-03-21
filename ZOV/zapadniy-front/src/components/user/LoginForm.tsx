import React, { useState } from 'react';
import { userService } from '../../services/userService';
import { User } from '../../types';
import api from '../../services/api';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testUsers, setTestUsers] = useState<any[]>([]);
  const [showTestUsers, setShowTestUsers] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await userService.login(username, password);
      onLoginSuccess(user);
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const fetchTestUsers = async () => {
    try {
      const response = await api.get('/users/test-users');
      const data = response.data;
      setTestUsers(data);
      setShowTestUsers(true);
    } catch (err) {
      console.error('Failed to fetch test users:', err);
      setError('Failed to load test users');
    }
  };

  const selectTestUser = (username: string, password: string) => {
    setUsername(username);
    setPassword(password);
    setShowTestUsers(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '24rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Вход</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Имя пользователя
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              required
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Пароль
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              required
            />
          </div>
          
          {error && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.25rem' }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ 
                flex: '1',
                backgroundColor: '#3b82f6', 
                color: 'white', 
                fontWeight: '500',
                padding: '0.5rem 1rem', 
                borderRadius: '0.25rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Загрузка...' : 'Вход'}
            </button>
            
            <button
              type="button"
              onClick={fetchTestUsers}
              style={{ 
                backgroundColor: '#e5e7eb', 
                color: '#1f2937', 
                padding: '0.5rem 1rem', 
                borderRadius: '0.25rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Тестовые аккаунты
            </button>
          </div>
        </form>

        {showTestUsers && testUsers.length > 0 && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Тестовые пользователи:</h3>
            <div style={{ maxHeight: '15rem', overflowY: 'auto' }}>
              {testUsers.map((user, index) => (
                <div 
                  key={index}
                  onClick={() => selectTestUser(user.username, user.password)}
                  style={{ 
                    padding: '0.5rem', 
                    borderBottom: '1px solid #e5e7eb', 
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <p style={{ fontWeight: '500' }}>{user.fullName}</p>
                    <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>@{user.username}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Password: {user.password}</p>
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '9999px', 
                    backgroundColor: '#dbeafe', 
                    color: '#1e40af', 
                    alignSelf: 'flex-start' 
                  }}>
                    {user.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm; 