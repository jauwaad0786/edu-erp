import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    setLoading(false);
    return;
  }
  api.get('/auth/me')
    .then(res => {
      if (res.data && res.data.id) {
        setUser(res.data);
      } else {
        localStorage.clear();
        setUser(null);
      }
    })
    .catch(err => {
      // 401 interceptor already handles refresh
      // sirf 403 ya real failure pe clear karo
      if (err.response?.status === 403 || err.response?.status === 404) {
        localStorage.clear();
        setUser(null);
      }
      // 401 pe kuch mat karo — interceptor refresh karega
    })
    .finally(() => setLoading(false));
}, []);

  const login = async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('access_token',  data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    setUser(data.user);
    return data.user;
  };

  // ── NEW: Student login (name + father + phone + password)
  const studentLogin = async (name, fatherName, phone, password) => {
    const { data } = await api.post('/auth/student-login', {
      name, father_name: fatherName, phone, password,
    });
    localStorage.setItem('access_token',  data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, studentLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
