# Authentication Utilities

This directory contains utilities for handling authentication, API requests, and error handling in the Backlify frontend.

## Authentication Flow

The Backlify application now uses JWT (JSON Web Tokens) for authentication, with two token types:

1. **Access Token**: A short-lived token (expires in ~1 hour) used for API authentication
2. **Refresh Token**: A longer-lived token (expires in ~7 days) used to obtain new access tokens

### Token Storage

Tokens are stored in two places:
- **Memory**: For security, tokens are primarily stored in memory through the `apiService.js` utility
- **localStorage**: As a fallback for page refreshes, tokens are also saved in localStorage

> **Security Note**: While HTTP-only cookies would be more secure, this implementation balances security and simplicity. The tokens are never exposed to JavaScript libraries or third-party code.

## Authentication Process

1. **Login**: User credentials are sent to `/auth/login`
2. **Token Receipt**: The backend returns `accessToken` and `refreshToken`
3. **Token Storage**: Tokens are stored in memory and localStorage
4. **API Requests**: The access token is automatically included in API requests
5. **Token Expiry**: If a 401/403 response is received, the token refresh flow is triggered

### Token Refresh Flow

1. **Detect Expiry**: Any 401/403 response triggers the refresh process
2. **Request New Token**: The refresh token is sent to `/auth/refresh`
3. **Update Tokens**: If successful, the new access token is stored
4. **Retry Request**: The original failed request is retried with the new token
5. **Fallback**: If refresh fails, the user is redirected to the login page

## Utilities

### `apiService.js`

The main API service that handles:
- Token storage and management
- API requests with authentication
- Token refresh flows
- Error response handling

```javascript
// Example: Making an authenticated API request
import { apiRequest } from '../utils/apiService';

// This will automatically include the access token
const data = await apiRequest('/some-endpoint', {
  method: 'GET'
});
```

### `fetchWithAuth.js`

A wrapper around `apiRequest` to make it easier to migrate existing code:

```javascript
// Before (direct fetch)
const response = await fetch('https://backlify-v2.onrender.com/my-endpoint', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

// After (with authentication)
import fetchWithAuth from '../utils/fetchWithAuth';

const data = await fetchWithAuth('https://backlify-v2.onrender.com/my-endpoint', {
  method: 'GET'
});
```

### `errorHandler.js`

Utilities for formatting and displaying user-friendly error messages:

```javascript
import { handleApiError } from '../utils/errorHandler';

try {
  // Make API request
} catch (error) {
  // Display error toast and format message
  const message = handleApiError(error);
  // Additional error handling if needed
}
```

## Integration Guidelines

When updating existing components:

1. Replace direct `fetch` calls with `apiRequest` or `fetchWithAuth`
2. Update error handling to use the `errorHandler` utilities
3. Make sure login/logout flows correctly manage tokens

For new components, use these utilities directly for a consistent approach to authentication. 