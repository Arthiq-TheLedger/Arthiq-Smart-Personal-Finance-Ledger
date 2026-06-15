import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export function setUnlockToken(companyId, token) {
  if (token) {
    sessionStorage.setItem(`unlock_${companyId}`, token);
  } else {
    sessionStorage.removeItem(`unlock_${companyId}`);
  }
}

export function getUnlockToken(companyId) {
  return sessionStorage.getItem(`unlock_${companyId}`);
}

export function clearUnlockToken(companyId) {
  sessionStorage.removeItem(`unlock_${companyId}`);
}

export function clearAllUnlockTokens() {
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith('unlock_'))
    .forEach((key) => sessionStorage.removeItem(key));
}

api.interceptors.request.use((config) => {
  const match = config.url?.match(/\/(companies|ledger|pdf)\/(\d+)/);
  if (match) {
    const token = getUnlockToken(match[2]);
    if (token) config.headers['x-company-unlock'] = token;
  }
  return config;
});

export default api;
