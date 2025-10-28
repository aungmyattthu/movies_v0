# Authentication with Refresh Token Guide

## Overview

The API now supports refresh tokens with HTTP-only cookies for better security. Access tokens are short-lived (15 minutes) and refresh tokens are long-lived (7 days).

## How It Works

1. **Login**: Returns access token + sets refresh token in HTTP-only cookie
2. **Refresh**: Uses cookie to get new access token when expired
3. **Logout**: Clears cookie and invalidates refresh token

## For Frontend Developers

### 1. Login

```javascript
const response = await fetch('http://47.128.81.163:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // IMPORTANT: Required for cookies
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  }),
});

const data = await response.json();
// Store only access_token in localStorage
localStorage.setItem('access_token', data.access_token);
// Refresh token is automatically stored in HTTP-only cookie
```

### 2. Making Authenticated Requests

```javascript
const response = await fetch('http://47.128.81.163:3000/movies', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  },
  credentials: 'include', // Include cookies
});
```

### 3. Refresh Access Token

When you get a 401 error, refresh the token:

```javascript
async function refreshAccessToken() {
  const response = await fetch('http://47.128.81.163:3000/auth/refresh', {
    credentials: 'include', // Sends refresh token cookie
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data.access_token;
  } else {
    // Refresh token expired, redirect to login
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }
}
```

### 4. Automatic Token Refresh (Axios Interceptor)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://47.128.81.163:3000',
  withCredentials: true, // Enable cookies
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token
        const { data } = await axios.get(
          'http://47.128.81.163:3000/auth/refresh',
          { withCredentials: true },
        );

        localStorage.setItem('access_token', data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
```

### 5. Logout

```javascript
async function logout() {
  const response = await fetch('http://47.128.81.163:3000/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
    credentials: 'include',
  });

  localStorage.removeItem('access_token');
  window.location.href = '/login';
}
```

## API Endpoints

### POST /auth/login

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "role": "free",
    "subscription": null
  }
}
```

**Cookie Set:** `refreshToken` (HTTP-only, Secure, SameSite=Strict, 7 days)

### GET /auth/refresh

**Request:** No body (uses cookie)

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/logout

**Headers:** `Authorization: Bearer <access_token>`

**Response:**

```json
{
  "message": "Successfully logged out"
}
```

## Environment Variables

Add to `.env` on server:

```env
NODE_ENV=production
FRONTEND_URL=http://your-frontend-domain.com
```

## Security Features

- ✅ Refresh token stored in HTTP-only cookie (XSS safe)
- ✅ Access token in localStorage (short-lived, 15 min)
- ✅ Refresh token expires after 7 days
- ✅ Refresh token hashed in database
- ✅ CORS configured with credentials
- ✅ SameSite=Strict cookie protection
- ✅ Secure flag in production

## Testing with cURL

```bash
# Login and save cookie
curl -X POST http://47.128.81.163:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Refresh token
curl http://47.128.81.163:3000/auth/refresh -b cookies.txt

# Logout
curl -X POST http://47.128.81.163:3000/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt
```

## Migration from Old Auth

**Old way:**

```javascript
// Both tokens in localStorage (vulnerable to XSS)
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('refresh_token', data.refresh_token);
```

**New way:**

```javascript
// Only access token in localStorage
// Refresh token automatically in HTTP-only cookie
localStorage.setItem('access_token', data.access_token);
// That's it! More secure!
```

## Common Issues

### CORS Error

Make sure to:

1. Set `credentials: 'include'` in fetch
2. Set `withCredentials: true` in axios
3. Backend has correct FRONTEND_URL in .env

### Cookie Not Set

Check:

1. Using HTTPS in production (required for Secure cookies)
2. Same domain for frontend and backend, or proper CORS setup
3. Browser allows third-party cookies if cross-domain

### 401 After Some Time

- Access token expires after 15 minutes
- Implement automatic refresh with interceptor
- Refresh endpoint will give you a new access token
