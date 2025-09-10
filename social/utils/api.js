import { API_BASE_URL } from '../constants/api.js';
import { storage } from './storage.js';
import Toast from 'react-native-toast-message';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = await storage.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let data = {};
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          // Refresh failed, redirect to login
          throw new Error('Session expired');
        }
        throw new Error('Token refreshed, retry request');
      }
      
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  }

  async refreshToken() {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      await storage.setTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  async request(endpoint, options = {}) {
    const { method = 'GET', body, includeAuth = true, isFormData = false } = options;
    
    try {
      const headers = await this.getHeaders(includeAuth);
      
      if (isFormData) {
        delete headers['Content-Type']; // Let browser set boundary for FormData
      }

      const config = {
        method,
        headers,
      };

      if (body) {
        config.body = isFormData ? body : JSON.stringify(body);
      }

      let response = await fetch(`${this.baseURL}${endpoint}`, config);
      return await this.handleResponse(response);
    } catch (error) {
      if (error.message === 'Token refreshed, retry request') {
        // Retry the original request with new token
        const headers = await this.getHeaders(includeAuth);
        if (isFormData) {
          delete headers['Content-Type'];
        }

        const config = {
          method,
          headers,
        };

        if (body) {
          config.body = isFormData ? body : JSON.stringify(body);
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, config);
        return await this.handleResponse(response);
      }
      
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: error.message,
      });
      
      throw error;
    }
  }

  // HTTP Methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
