import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,

  async err => {
    const originalReq = err.config;

    if (err.response?.status === 401 && !originalReq._retry) {
      originalReq._retry = true;

      try {
        const refresh = localStorage.getItem('refresh_token');

        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refresh}`
            }
          }
        );

        localStorage.setItem('access_token', data.access_token);

        originalReq.headers.Authorization =
          `Bearer ${data.access_token}`;

        return api(originalReq);

      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(err);
  }
);

export default api;
