# Architecture Overview

## Simplified Frontend-Only Design

This PoC uses a **frontend-only architecture** where the React application calls Microsoft Graph API directly.

```
┌─────────────────────────────────────────────────────────┐
│                      User Browser                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │         React Application (Port 3000)              │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────┐    │  │
│  │  │  MSAL Authentication                      │    │  │
│  │  │  - User Sign In                           │    │  │
│  │  │  - Acquire Access Token                   │    │  │
│  │  │  - Token with Delegated Permissions       │    │  │
│  │  └──────────────────────────────────────────┘    │  │
│  │                     │                             │  │
│  │                     ▼                             │  │
│  │  ┌──────────────────────────────────────────┐    │  │
│  │  │  Approval Service                         │    │  │
│  │  │  - getApprovals()                         │    │  │
│  │  │  - createApproval()                       │    │  │
│  │  │  - respondToApproval()                    │    │  │
│  │  └──────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ HTTPS with Bearer Token
                         │ Authorization: Bearer <user_token>
                         │
                         ▼
         ┌───────────────────────────────────┐
         │   Microsoft Graph API              │
         │   https://graph.microsoft.com      │
         │   /beta/solutions/approval/        │
         │                                    │
         │   ✓ Delegated Permissions          │
         │   ✓ User Context Required          │
         │   ✓ BETA Endpoint Only             │
         └───────────────────────────────────┘
```

## Why No Backend?

### The Constraint
The **Microsoft Graph Approvals API only supports delegated permissions** (user context). This means:
- ❌ Application permissions (app-only access) are NOT supported
- ✓ Delegated permissions (user access) are required
- ✓ API calls must include a user's access token

### The Solution
Since the API requires a user token, we can call it directly from the frontend:
1. User signs in via MSAL in the React app
2. MSAL acquires an access token with delegated permissions
3. React app includes the token in API calls to Microsoft Graph
4. Microsoft Graph validates the token and returns data based on user permissions

### Benefits of This Approach
- ✅ **Simpler**: No backend server to maintain
- ✅ **Correct**: Uses delegated permissions as required by the API
- ✅ **Secure**: User token never exposed, managed by MSAL
- ✅ **Efficient**: Fewer network hops, faster responses
- ✅ **Easy to Demo**: Just one `npm start` command

## Authentication Flow

```
1. User clicks "Sign In with Microsoft"
   │
   ▼
2. MSAL redirects to Microsoft Login
   │
   ▼
3. User authenticates with Microsoft credentials
   │
   ▼
4. Microsoft redirects back to app with auth code
   │
   ▼
5. MSAL exchanges code for access token
   │
   ▼
6. App stores token securely in browser
   │
   ▼
7. On API call, MSAL provides token
   │
   ▼
8. App includes token in Authorization header
   │
   ▼
9. Microsoft Graph validates token and returns data
```

## API Call Example

When the user clicks "Refresh List" to get approvals:

```javascript
// 1. Get user's access token from MSAL
const response = await msalInstance.acquireTokenSilent({
  scopes: ['ApprovalSolution.ReadWrite'],
  account: accounts[0]
});

// 2. Make direct API call to Microsoft Graph
const approvals = await axios.get(
  'https://graph.microsoft.com/beta/solutions/approval/approvalItems',
  {
    headers: {
      'Authorization': `Bearer ${response.accessToken}`,
      'Content-Type': 'application/json'
    }
  }
);

// 3. Display results to user
```

## Permissions Model

### Delegated Permissions (What We Use)
- User signs in and consents to permissions
- App acts on behalf of the user
- API returns data the user has access to
- **Perfect for**: Interactive applications, user-specific data

### Application Permissions (Not Supported by Approvals API)
- App uses its own identity
- No user sign-in required
- App has permissions independent of users
- **Used for**: Background services, daemon apps

## Key Files

### Frontend
- `src/authConfig.js` - MSAL configuration with client ID and scopes
- `src/services/approvalService.js` - Functions to call Microsoft Graph API
- `src/components/ApprovalsList.js` - UI component that fetches and displays approvals
- `src/components/CreateApproval.js` - UI component to create new approvals

### Configuration
- `frontend/.env` - Contains:
  - `REACT_APP_CLIENT_ID` - Azure app registration ID
  - `REACT_APP_TENANT_ID` - Your organization's tenant ID

## Security Considerations

### ✅ Secure
- Access tokens never stored permanently
- Tokens managed by MSAL library
- Tokens automatically refreshed
- HTTPS enforced in production
- CORS policies protect API endpoints

### 🔒 Best Practices Implemented
- Minimal scopes requested (principle of least privilege)
- Silent token acquisition with fallback to interactive
- Proper error handling for auth failures
- Redirect URI validation in Azure

## Testing the PoC

### What to Demonstrate
1. **User Authentication**: Show sign-in flow
2. **User Context**: Different users see different approvals
3. **Create Approval**: Create a new approval request
4. **Respond to Approval**: Approve or reject requests
5. **Real-time Updates**: Refresh to see new data

### Expected Behavior
- Each user sees approvals where they are an **approver** or **owner**
- Users cannot see approvals they're not involved with
- Responses are recorded with the user's identity
- All actions are performed in the user's security context

## Production Deployment

To deploy this PoC to production:

1. **Deploy to Azure Static Web Apps**
   ```bash
   az staticwebapp create \
     --name approvals-poc \
     --resource-group my-rg \
     --source ./frontend \
     --location "East US"
   ```

2. **Update Azure App Registration**
   - Add production redirect URI (e.g., `https://approvals-poc.azurestaticapps.net`)
   - Keep `http://localhost:3000` for local development

3. **Configure Environment Variables**
   - Set `REACT_APP_CLIENT_ID` in Static Web App configuration
   - Set `REACT_APP_TENANT_ID` in Static Web App configuration

4. **Enable Custom Domain** (optional)
   - Configure custom domain in Static Web Apps
   - Update redirect URI in Azure app registration

## Troubleshooting

### Token Issues
- Check that admin consent is granted for all permissions
- Verify redirect URI matches exactly
- Clear browser cache if tokens seem stale

### API Errors
- Confirm you're using `/beta/` endpoint (not `/v1.0/`)
- Check that permissions include `ApprovalSolution.ReadWrite`
- Verify the API is available in your tenant

### Seeing Unexpected Approvals
- This is normal - users see approvals where they're involved
- The API automatically filters based on user permissions
- Different users will see different lists

## Summary

This architecture demonstrates the **simplest and most correct way** to integrate with Microsoft Graph Approvals API:

- ✅ Frontend-only React application
- ✅ MSAL for authentication
- ✅ Direct API calls with user tokens
- ✅ Delegated permissions as required
- ✅ Simple, maintainable, and production-ready

**Perfect for demonstrating to customers how to integrate Approvals API into their applications!**
