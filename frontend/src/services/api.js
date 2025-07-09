const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Check for tokens in sessionStorage first (current session), then localStorage (persistent)
    let token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request with new token
          token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
          config.headers.Authorization = `Bearer ${token}`;
          const retryResponse = await fetch(url, config);
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          return await retryResponse.json();
        } else {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          sessionStorage.removeItem('remember_me');
          window.location.href = '/login';
          return;
        }
      }

      // Treat 201 as success (created)
      if (response.status === 201 || response.status === 200) {
        // Try to parse JSON, but fallback to empty object if not JSON
        try {
          return await response.json();
        } catch {
          return {};
        }
      }

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch {}
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // Default fallback
      return {};
    } catch (error) {
      throw error;
    }
  }

  async refreshToken() {
    // Check for refresh token in sessionStorage first, then localStorage
    const refreshToken = sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        // Save both access and refresh tokens to both storage types
        if (data.access) {
          localStorage.setItem('access_token', data.access);
          sessionStorage.setItem('access_token', data.access);
        }
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
          sessionStorage.setItem('refresh_token', data.refresh);
        }
        return true;
      }
      // If refresh fails, clear tokens from both storage types
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('remember_me');
      return false;
    } catch {
      // Clear tokens from both storage types on error
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('remember_me');
      return false;
    }
  }

  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

const api = new ApiService();
export default api;

