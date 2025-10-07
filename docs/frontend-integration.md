# Frontend Integration Guide

## 🔄 **Complete Authentication Flow**

### **1. Login Process**

#### Option A: LINE Login (Redirect Flow)
```javascript
// Redirect user to LINE login
window.location.href = 'http://localhost:3000/callback?code=...&state=...';

// After successful login, user is redirected to:
// https://your-frontend.com/auth/callback?token=JWT_TOKEN&profile=USER_PROFILE
```

#### Option B: Test Token Generation (Development)
```javascript
// Generate test token for development
const response = await fetch('http://localhost:3000/api/auth/test-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    uid: 'test-user-123',
    email: 'test@example.com',
    role: 'admin' // or 'customer', 'coach'
  })
});

const data = await response.json();
const token = data.data.token;
```

### **2. Frontend Token Management**

#### React/Vue/Angular Example
```javascript
// auth.js - Authentication service
class AuthService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  // Save token after login
  setToken(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Get token for API calls
  getToken() {
    return this.token;
  }

  // Check if user is logged in
  isAuthenticated() {
    return !!this.token && !this.isTokenExpired();
  }

  // Check if token is expired (basic check)
  isTokenExpired() {
    if (!this.token) return true;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  // Logout
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  // Get authorization header
  getAuthHeader() {
    return this.token ? `Bearer ${this.token}` : null;
  }
}

const authService = new AuthService();
export default authService;
```

### **3. API Request Integration**

#### Axios Interceptor
```javascript
import axios from 'axios';
import authService from './auth';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:3000'
});

// Request interceptor - automatically add auth header
api.interceptors.request.use(
  (config) => {
    const token = authService.getAuthHeader();
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### Fetch Wrapper
```javascript
import authService from './auth';

class ApiClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth header if token exists
    const authHeader = authService.getAuthHeader();
    if (authHeader) {
      config.headers.Authorization = authHeader;
    }

    try {
      const response = await fetch(url, config);
      
      // Handle auth errors
      if (response.status === 401) {
        authService.logout();
        window.location.href = '/login';
        throw new Error('Authentication required');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Convenience methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

const apiClient = new ApiClient();
export default apiClient;
```

### **4. React Hook Example**

```jsx
import { useState, useEffect, createContext, useContext } from 'react';
import authService from './auth';
import apiClient from './api';

// Auth Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    if (authService.isAuthenticated()) {
      try {
        // Verify token with backend
        const response = await apiClient.get('/api/auth/me');
        setUser(response.data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        authService.logout();
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = (token, userData) => {
    authService.setToken(token, userData);
    setUser(userData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Protected Route Component
export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <div>Access denied. Required role: {requiredRole}</div>;
  }

  return children;
};
```

### **5. Usage Examples**

#### Login Component
```jsx
import { useAuth } from './AuthContext';
import apiClient from './api';

const LoginComponent = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleTestLogin = async (role = 'customer') => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/test-token', {
        role: role,
        email: `test-${role}@example.com`
      });

      const { token, user } = response.data;
      login(token, user);
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <button 
        onClick={() => handleTestLogin('customer')} 
        disabled={loading}
      >
        Login as Customer
      </button>
      <button 
        onClick={() => handleTestLogin('admin')} 
        disabled={loading}
      >
        Login as Admin
      </button>
      <button 
        onClick={() => window.location.href = '/line-login'} 
        disabled={loading}
      >
        Login with LINE
      </button>
    </div>
  );
};
```

#### API Usage in Components
```jsx
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import apiClient from './api';

const ReservationsComponent = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await apiClient.get('/api/reservations/my');
      setReservations(response.data);
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReservation = async (reservationData) => {
    try {
      const response = await apiClient.post('/api/reservations', reservationData);
      console.log('Reservation created:', response.data);
      fetchReservations(); // Refresh list
    } catch (error) {
      console.error('Failed to create reservation:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>My Reservations</h2>
      <p>Welcome, {user.name}!</p>
      {reservations.map(reservation => (
        <div key={reservation.id}>
          <p>Date: {reservation.date}</p>
          <p>Time: {reservation.timeSlot}</p>
          <p>Status: {reservation.status}</p>
        </div>
      ))}
    </div>
  );
};
```

### **6. Admin Dashboard Example**

```jsx
import { useAuth } from './AuthContext';
import apiClient from './api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminStats();
    }
  }, [user]);

  const fetchAdminStats = async () => {
    try {
      const response = await apiClient.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  };

  if (user?.role !== 'admin') {
    return <div>Access denied. Admin role required.</div>;
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>
      {stats && (
        <div>
          <p>Total Reservations: {stats.total}</p>
          <p>Confirmed: {stats.confirmed}</p>
          <p>Pending: {stats.pending}</p>
          <p>Revenue: ${stats.totalRevenue}</p>
        </div>
      )}
    </div>
  );
};
```

## 🔑 **Available Endpoints for Frontend**

### Authentication
- `POST /api/auth/test-token` - Generate test token (development)
- `GET /api/auth/me` - Check login status and get user profile
- `GET /callback` - LINE login callback (redirect)

### API Endpoints (require Bearer token)
- `GET /api/reservations/my` - Get user's reservations
- `POST /api/reservations` - Create new reservation
- `GET /api/admin/stats` - Admin statistics (admin only)
- `GET /api/coaches` - Get all coaches (public)

## 🚀 **Quick Start**

1. **Generate a test token:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/test-token \
     -H "Content-Type: application/json" \
     -d '{"role": "admin", "email": "admin@test.com"}'
   ```

2. **Use the token in your frontend:**
   ```javascript
   const token = "your-jwt-token-here";
   localStorage.setItem('auth_token', token);
   ```

3. **Make authenticated requests:**
   ```javascript
   fetch('/api/reservations/my', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   });
   ```

This setup provides a complete authentication flow that works with both LINE login and test tokens for development!
