# Microsoft Graph Approvals API - Important Notes & Troubleshooting

## ⚠️ Critical Information About the Approvals API

### API Status: BETA Only
The Microsoft Graph Approvals API is **only available in BETA** (`/beta` endpoint). It is not available in the v1.0 endpoint.

**What this means:**
- Use `https://graph.microsoft.com/beta/` instead of `v1.0`
- BETA APIs may change without notice
- Not recommended for production applications
- May have limited support and documentation

### Permission Names (CORRECTED)

**❌ WRONG Permission Names:**
- `ApprovalItems.ReadWrite.All` - **Does NOT exist**
- `Approval.ReadWrite.All` - **Does NOT exist**

**✅ CORRECT Permission Names:**
- `ApprovalSolution.Read` - Read approval items
- `ApprovalSolution.ReadWrite` - Read and write approval items  
- `ApprovalSolutionResponse.ReadWrite` - Create responses to approvals

### Application vs Delegated Permissions

**IMPORTANT**: The Approvals API **ONLY supports Delegated permissions**.

| Permission Type | Supported? | Notes |
|----------------|------------|-------|
| Delegated (work or school) | ✅ Yes | Required - must have signed-in user |
| Delegated (personal account) | ❌ No | Not supported |
| Application | ❌ No | **NOT SUPPORTED** - this is the key limitation |

**What this means for your architecture:**
- You **cannot** use client credentials flow (app-only access)
- You **must** have a signed-in user context
- Backend services need to use On-Behalf-Of (OBO) flow or pass user tokens
- For this PoC, the backend uses application credentials but the API still requires user context

## Finding Permissions in Azure Portal

When setting up app registrations, you may not see `ApprovalItems.ReadWrite.All` because **it doesn't exist**.

### How to Find the Correct Permissions:

1. Go to Azure Portal > App Registrations > Your App
2. Click **API Permissions** > **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions** (NOT Application)
5. In the search box, type: **`ApprovalSolution`**
6. You should see:
   - `ApprovalSolution.Read`
   - `ApprovalSolution.ReadWrite`
7. Also search for: **`ApprovalSolutionResponse`**
   - `ApprovalSolutionResponse.ReadWrite`

If you don't see these permissions, it may mean:
- Your tenant doesn't have the Approvals app enabled
- You may need to wait for the permissions to propagate
- The feature may not be available in your tenant tier

## Prerequisites

### Tenant Requirements
To use the Approvals API, your Microsoft 365 tenant must have:

1. **Microsoft Teams** enabled
2. **Approvals app** available in Teams
3. **Appropriate licensing** (Microsoft 365 E3/E5 or Business Premium)

### Checking if Approvals is Available

1. Open Microsoft Teams
2. Click **Apps** in the left sidebar
3. Search for **"Approvals"**
4. If you see the Approvals app, the API should be available

If the Approvals app is not available:
- Contact your tenant administrator
- Check your Microsoft 365 licensing
- The Approvals feature may need to be enabled

## Common Errors and Solutions

### Error: "Permission not found"

**Problem**: When trying to add `ApprovalItems.ReadWrite.All`

**Solution**: Use the correct permission names:
- `ApprovalSolution.ReadWrite`
- `ApprovalSolutionResponse.ReadWrite`

### Error: "Insufficient privileges to complete the operation"

**Possible Causes:**
1. **Using Application permissions instead of Delegated**
   - Solution: Switch to Delegated permissions
2. **Admin consent not granted**
   - Solution: Grant admin consent for the permissions
3. **Approvals app not enabled in tenant**
   - Solution: Enable the Approvals app in Teams admin center

### Error: "Resource not found" when calling API

**Possible Causes:**
1. **Using v1.0 instead of beta**
   - Solution: Change endpoint to `https://graph.microsoft.com/beta/`
2. **No approvals exist yet**
   - Solution: Create an approval in Teams first to test

### Error: "Invalid authentication token"

**Problem**: Backend using application-only credentials

**Solution**: The Approvals API requires user context. You need to:
- Use On-Behalf-Of flow
- Pass user access tokens from frontend to backend
- Backend acts on behalf of the user, not as the application

## API Endpoint Reference

All Approvals API endpoints use the **BETA** path:

```
✅ Correct:
GET https://graph.microsoft.com/beta/solutions/approval/approvalItems

❌ Wrong:
GET https://graph.microsoft.com/v1.0/solutions/approval/approvalItems
```

## Workaround for Backend

Since Application permissions are not supported, you have two options:

### Option 1: Pass User Token from Frontend (Simpler)
Frontend gets the user's access token and passes it to the backend. Backend uses that token to call Graph API.

### Option 2: On-Behalf-Of Flow (More Secure)
Frontend sends user token to backend. Backend exchanges it for a new token using OBO flow.

**For this PoC**, we recommend **Option 1** for simplicity.

## Updated Architecture

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   Frontend  │ Token   │   Backend   │  Token  │ Microsoft    │
│   (React)   │─────────▶│  (Express)  │─────────▶│ Graph API    │
│             │         │             │         │ (BETA)       │
└─────────────┘         └─────────────┘         └──────────────┘
     │                                                   │
     │ User signs in with MSAL                          │
     │◄──────────────────────────────────────────────────┘
     │ Gets delegated access token
```

## Microsoft Documentation References

- [Approvals API Overview](https://learn.microsoft.com/en-us/graph/approvals-app-api)
- [approvalItem resource](https://learn.microsoft.com/en-us/graph/api/resources/approvalitem?view=graph-rest-beta)
- [List approvalItems](https://learn.microsoft.com/en-us/graph/api/approvalsolution-list-approvalitems?view=graph-rest-beta)
- [Microsoft Graph Permissions Reference](https://learn.microsoft.com/en-us/graph/permissions-reference)

## Summary

✅ **DO**:
- Use `ApprovalSolution.ReadWrite` and `ApprovalSolutionResponse.ReadWrite`
- Use Delegated permissions only
- Use `/beta/` endpoints
- Require signed-in user
- Have Microsoft Teams Approvals app enabled

❌ **DON'T**:
- Try to use `ApprovalItems.ReadWrite.All` (doesn't exist)
- Use Application permissions (not supported)
- Use `/v1.0/` endpoints (API not available)
- Expect app-only access to work

---

**Last Updated**: Based on Microsoft Graph BETA API as of December 2025
