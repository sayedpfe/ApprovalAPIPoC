# Backend Architecture Issue - IMPORTANT

## The Problem

The current backend implementation has a **critical design flaw**:

1. The backend uses **Client Credentials flow** (application-only authentication)
2. The Microsoft Graph Approvals API **ONLY supports Delegated permissions**
3. This means the backend **cannot directly call the Approvals API** without a user context

## Why the Backend Fails

When you start the backend with `npm start`, it tries to create a Microsoft Graph client using:
```javascript
const credential = new ClientSecretCredential(
  process.env.TENANT_ID,
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);
```

This creates an **app-only token** which the Approvals API rejects.

## Solutions

### Option 1: Simple Pass-Through (Recommended for PoC)

**Remove the backend entirely and call Microsoft Graph directly from the frontend.**

The frontend already has MSAL authentication and can get user tokens with the correct delegated permissions.

**Steps:**
1. Update `frontend/src/services/approvalService.js` to call Graph API directly
2. Use the MSAL access token
3. No backend needed!

### Option 2: Token Pass-Through Backend

**Keep the backend but pass the user's access token from frontend to backend.**

**Changes needed:**
1. Frontend: Send the user's access token in the Authorization header to backend
2. Backend: Use the user's token instead of getting its own token
3. Backend acts as a proxy, not as an independent app

### Option 3: On-Behalf-Of (OBO) Flow

**Implement the On-Behalf-Of flow** (more complex, production-ready)

1. Frontend sends user token to backend
2. Backend exchanges user token for a new token using OBO flow
3. Backend uses the new token to call Graph API

## Quick Fix for Testing

To get the PoC working quickly, **call Microsoft Graph directly from the frontend**:

### Update `frontend/src/services/approvalService.js`:

```javascript
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../authConfig';

const msalInstance = new PublicClientApplication(msalConfig);

class ApprovalService {
  async getAccessToken() {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) throw new Error('No accounts found');
    
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: accounts[0]
    });
    return response.accessToken;
  }

  async getApprovals() {
    try {
      const token = await this.getAccessToken();
      const response = await fetch('https://graph.microsoft.com/beta/solutions/approval/approvalItems', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching approvals:', error);
      throw error;
    }
  }

  // Similar changes for other methods...
}

export default new ApprovalService();
```

## Why This Matters

The Approvals API limitation means:
- ✅ **Can** be called from a user-facing application (SPA, mobile app)
- ❌ **Cannot** be called from a daemon/background service
- ❌ **Cannot** be used for automated workflows without user interaction
- ✅ **Can** be used with a backend if the backend uses the user's token

## Recommended Architecture for PoC

```
┌─────────────┐                    ┌──────────────┐
│   Frontend  │  User Token        │ Microsoft    │
│   (React)   │───────────────────▶│ Graph API    │
│   + MSAL    │                    │ (BETA)       │
└─────────────┘                    └──────────────┘
      │
      │ User signs in
      │ Gets delegated access token
      │ Calls API directly
```

**Backend is optional** for this PoC since it adds complexity without value for the Approvals API.

## Current Status

❌ Backend will **fail** or **return errors** when trying to call Approvals API  
✅ Frontend **will work** if you call Microsoft Graph directly

## Next Steps

Choose one of the options above to fix the architecture. For a quick PoC demo, I recommend **Option 1** (frontend-only).
