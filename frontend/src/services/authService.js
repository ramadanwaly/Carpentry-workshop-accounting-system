import axios from 'axios';

export async function login(username, password) {
  try {
    const res = await axios.post('http://localhost:3001/api/login', { username, password });
    return { token: res.data.token };
  } catch (err) {
    return { error: err.response?.data?.message || 'حدث خطأ' };
  }
} 