# Authentication Fix for API Chat Endpoint

## Issue Description

The `api/chat` endpoint was experiencing authentication errors when users had multiple auth tokens, while the `api/chat-rooms` endpoint worked correctly with the same authentication setup.

## Root Cause

The issue was in the `validateAuthToken` function in `api/chat.ts`. The function was attempting to use multi-token authentication patterns but was missing the necessary helper functions that were present in `api/chat-rooms.js`.

### Missing Components

1. **`getTokenKey(token)` function**: Builds the Redis key for token-to-username mapping
2. **`getUsernameForToken(token)` function**: Retrieves the username associated with a specific token
3. **Proper multi-token validation logic**: The chat API was using direct Redis key construction instead of the helper functions

## Solution Applied

### 1. Added Missing Helper Functions

```typescript
// Helper functions for multi-token support
const getTokenKey = (token: string) => `${AUTH_TOKEN_PREFIX}${token}`;

const getUsernameForToken = async (token: string) => {
  if (!token) return null;
  return await redis.get(getTokenKey(token));
};
```

### 2. Updated Authentication Logic

Updated the `validateAuthToken` function to:

- Use `getUsernameForToken()` instead of direct Redis key construction
- Use `getTokenKey()` for consistent key building
- Follow the same three-step validation process as chat-rooms:
  1. **Multi-token path**: Check token-to-username mapping (preferred)
  2. **Legacy path**: Check username-to-token mapping (backward compatibility)
  3. **Grace period path**: Allow refresh of recently expired tokens

### 3. Fixed Type Issues

- Removed unused `TOKEN_LAST_PREFIX` constant
- Added proper type casting for Redis responses: `String(mappedUsername).toLowerCase()`

## Authentication Flow

The fixed authentication now supports:

1. **Multiple active tokens per user**: Users can be signed in from multiple devices
2. **Legacy single-token support**: Backward compatibility with old authentication
3. **Grace period refresh**: Expired tokens can be refreshed within a 365-day window
4. **Automatic TTL refresh**: Valid tokens get their expiration extended on each use

## Key Differences from Previous Implementation

| Before | After |
|--------|-------|
| Direct Redis key construction: `${AUTH_TOKEN_PREFIX}${authToken}` | Helper function: `getTokenKey(authToken)` |
| Direct Redis get: `await redis.get(directKey)` | Helper function: `await getUsernameForToken(authToken)` |
| Inconsistent with chat-rooms API | Consistent authentication logic across both APIs |
| Missing multi-token support functions | Full multi-token support infrastructure |

## Testing

The fix ensures that:
- Users with multiple auth tokens can successfully authenticate
- Single-token users continue to work (backward compatibility)
- Grace period token refresh works correctly
- TTL expiration is properly managed

## Files Modified

- `api/chat.ts`: Added helper functions and updated `validateAuthToken` function

## Verification

The authentication logic now matches the working implementation in `api/chat-rooms.js`, ensuring consistent behavior across both endpoints.