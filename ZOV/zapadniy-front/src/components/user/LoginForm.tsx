import React, { useState } from 'react';
import { userService } from '../../services/userService';
import { User } from '../../types';

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
      const response = await fetch('http://localhost:8080/api/users/test-users');
      const data = await response.json();
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Вход</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 mb-2">
              Имя пользователя
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white font-medium py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 flex-1"
            >
              {loading ? 'Загрузка...' : 'Вход'}
            </button>
            
            <button
              type="button"
              onClick={fetchTestUsers}
              className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Тестовые аккаунты
            </button>
          </div>
        </form>

        {showTestUsers && testUsers.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Тестовые пользователи:</h3>
            <div className="max-h-60 overflow-y-auto">
              {testUsers.map((user, index) => (
                <div 
                  key={index}
                  onClick={() => selectTestUser(user.username, user.password)}
                  className="p-2 border-b hover:bg-gray-100 cursor-pointer flex justify-between"
                >
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                  </div>
                  <div className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 self-start">
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