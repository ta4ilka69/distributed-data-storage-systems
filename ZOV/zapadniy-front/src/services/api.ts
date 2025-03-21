import axios from 'axios';

// Use relative URLs which will automatically use the same hostname
// This handles both local and public access automatically
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;