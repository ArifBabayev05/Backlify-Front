# Backlify Cache System

This document provides guidance on using the caching system implemented in Backlify.

## Overview

The caching system is designed to reduce API calls by storing responses in localStorage. This improves application performance, reduces server load, and provides a better user experience.

## How It Works

1. When an API request is made using `apiRequest()`, the system checks if a cached response exists.
2. If a valid cache exists (not expired), it returns the cached data instead of making a network request.
3. If no valid cache exists, it makes the API request and caches the response.
4. Cache entries automatically expire after a configurable time period (default: 5 minutes).
5. When data is modified (POST/PUT/DELETE requests), related cache entries are automatically invalidated.

## Usage Examples

### Basic Usage (Automatic)

The caching is built into the existing `apiRequest` and `fetchWithAuth` functions. It works automatically for GET requests:

```javascript
// This request will use cache if available
const data = await apiRequest('/my-apis', { method: 'GET' });
```

### Skip Cache When Needed

```javascript
// This forces a fresh request, bypassing cache
const freshData = await apiRequest('/my-apis', {
  method: 'GET',
  skipCache: true 
});
```

### Using the Cache Hook in Components

```javascript
import { useCacheControl } from '../utils';

function MyComponent() {
  const { invalidateCache, forceRefresh } = useCacheControl();
  
  const handleForceRefresh = async () => {
    // Use the forceRefresh option to skip cache
    const data = await apiRequest('/my-endpoint', {
      ...forceRefresh()
    });
    // Process data...
  };
  
  const handleClearCache = () => {
    // Clear all cache or specific endpoint cache
    invalidateCache('/my-endpoint');
  };
  
  // Rest of component...
}
```

### Configure Cache Duration

You can modify how long different endpoints are cached:

```javascript
import { configureCacheDuration } from '../utils/cacheService';

// Set cache duration for specific endpoint (30 seconds)
configureCacheDuration('/my-apis', 30 * 1000); 

// Set cache duration for all 'user' related endpoints (10 minutes)
configureCacheDuration('/users', 10 * 60 * 1000);
```

## Cache Implementation Details

- Cache keys are deterministically generated from the endpoint and request options
- Cache entries are stored in localStorage with a prefix to avoid collisions
- Cache entries include both the response data and an expiration timestamp
- When a cache entry is retrieved, its expiry is checked; expired entries are automatically removed
- POST, PUT, and DELETE requests automatically invalidate related cache entries
- Authentication operations (login/logout) clear all cache

## Debugging Cache Issues

If you encounter issues with stale data:

1. Use the browser's developer tools to inspect localStorage
2. Look for entries beginning with `backlify_cache_`
3. Try clearing the cache with `invalidateCache()`
4. Use `skipCache: true` for specific requests that need fresh data
5. Check the browser console for cache-related logs (prefixed with `[Cache]`)

## Cache Limitations

- Cache is stored in localStorage, which is limited to about 5MB
- Only successful responses are cached
- Only GET requests are cached by default
- Cache is specific to the browser and not shared between users or devices 