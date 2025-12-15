# Azure App Registration Setup Guide

This guide provides detailed step-by-step instructions for setting up the Azure App Registrations required for this PoC.

## ⚠️ Important: Approvals API Limitations

**The Microsoft Graph Approvals API has the following constraints:**
1. **BETA API Only**: The Approvals API is currently in BETA (`/beta` endpoint) and is not available in v1.0
2. **Delegated Permissions Only**: Application permissions are NOT supported. All operations require a signed-in user
3. **Permission Names**: The correct permissions are `ApprovalSolution.ReadWrite` and `ApprovalSolutionResponse.ReadWrite` (NOT `ApprovalItems.ReadWrite.All`)
4. **Not Production Ready**: BETA APIs may change and are not recommended for production applications

## Prerequisites

- Access to Azure Portal with permissions to create app registrations
- A Microsoft 365 tenant or Azure Active Directory tenant
- Global Administrator or Application Administrator role (for granting admin consent)
- **Microsoft Teams Approvals app must be available in your tenant**

## Part 1: Backend App Registration (Confidential Client)

The backend application uses application permissions to call Microsoft Graph on behalf of the application itself.

### Step 1: Create the App Registration

1. Sign in to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** (or **Microsoft Entra ID**)
3. Select **App registrations** from the left menu
4. Click **+ New registration**

### Step 2: Configure Basic Settings

Fill in the registration form:
- **Name**: `Approvals-API-Backend`
- **Supported account types**: 
  - Select **Accounts in this organizational directory only (Single tenant)**
- **Redirect URI**: Leave blank (not needed for backend service)

Click **Register**

### Step 3: Note Important IDs

After registration, you'll see the Overview page. **Copy and save** these values:
- **Application (client) ID**: (e.g., `12345678-1234-1234-1234-123456789abc`)
- **Directory (tenant) ID**: (e.g., `87654321-4321-4321-4321-abcdef123456`)

### Step 4: Create Client Secret

1. In the left menu, click **Certificates & secrets**
2. Under **Client secrets**, click **+ New client secret**
3. Add a description (e.g., `Backend PoC Secret`)
4. Choose an expiration period:
   - For PoC: **180 days (6 months)** or **Custom**
   - For Production: Follow your organization's security policies
5. Click **Add**
6. **IMPORTANT**: Copy the **Value** immediately - you won't be able to see it again!

### Step 5: Configure API Permissions

**IMPORTANT NOTE**: The Microsoft Graph Approvals API is currently in **BETA** and **does NOT support Application permissions**. For this PoC, we'll use **Delegated permissions** for the backend.

1. In the left menu, click **API permissions**
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions** (NOT Application permissions)
5. Search for and add these permissions:
   - `ApprovalSolution.ReadWrite` - Read and write approval items
   - `User.Read` - Read basic user profile
6. Click **Add permissions**

### Step 6: Grant Admin Consent

**CRITICAL**: Application permissions require admin consent.

1. On the API permissions page, click **Grant admin consent for [Your Organization]**
2. Click **Yes** to confirm
3. Verify that the **Status** column shows a green checkmark for all permissions

### Step 7: Configure Optional Settings (Recommended)

#### Enable Service Principal
The app is automatically enabled, but verify:
1. Go to **Enterprise applications** in Azure AD
2. Find your app `Approvals-API-Backend`
3. Ensure **Enabled for users to sign in** is set to **Yes**

---

## Part 2: Frontend App Registration (Public Client)

The frontend application uses delegated permissions and allows users to sign in.

### Step 1: Create the App Registration

1. In Azure Portal, go to **Azure Active Directory** > **App registrations**
2. Click **+ New registration**

### Step 2: Configure Basic Settings

Fill in the registration form:
- **Name**: `Approvals-API-Frontend`
- **Supported account types**: 
  - Select **Accounts in this organizational directory only (Single tenant)**
- **Redirect URI**: 
  - Platform: **Single-page application (SPA)**
  - URI: `http://localhost:3000`

Click **Register**

### Step 3: Note the Client ID

From the Overview page, **copy and save**:
- **Application (client) ID**: (e.g., `abcdef12-3456-7890-abcd-ef1234567890`)
- **Directory (tenant) ID**: (should be the same as backend)

### Step 4: Configure Redirect URIs

1. In the left menu, click **Authentication**
2. Under **Single-page application**, verify `http://localhost:3000` is listed
3. If deploying to production later, add additional URIs (e.g., `https://yourdomain.com`)
4. Under **Implicit grant and hybrid flows**, ensure nothing is checked (not needed for SPA with MSAL 2.x+)
5. Click **Save**

### Step 5: Configure API Permissions

1. In the left menu, click **API permissions**
2. The default `User.Read` permission should already be there
3. Click **+ Add a permission**
4. Select **Microsoft Graph**
5. Select **Delegated permissions**
6. Search for and add:
   - `ApprovalSolution.ReadWrite` - Read and write approval items on behalf of user
   - `ApprovalSolutionResponse.ReadWrite` - Create responses to approvals
7. Click **Add permissions**

### Step 6: Grant Admin Consent

1. Click **Grant admin consent for [Your Organization]**
2. Click **Yes** to confirm
3. Verify all permissions show green checkmarks

### Step 7: Configure Advanced Settings (Optional)

**This step is OPTIONAL** - you can skip it for the basic PoC setup.

#### Optional Claims (Not Required)
If you want to add optional claims to tokens:
1. In the left menu, click **Token configuration**
2. Click **+ Add optional claim**
3. Select token type:
   - **ID token** - Claims about the user returned during sign-in (e.g., email, preferred_username)
   - **Access token** - Claims included when calling APIs (e.g., groups, roles)
   - **SAML token** - Only if using SAML (not applicable for this PoC)
4. For this PoC, default claims are sufficient - **no need to add any**

#### Verify Manifest (Optional)
1. In the left menu, click **Manifest**
2. Find `"allowPublicClient"` and verify it's set to `true`
3. This should already be correct for a SPA application
4. Click **Save** only if you made changes

**For this PoC, you can skip Step 7 entirely** - the default configuration works fine.

---

## Part 3: Verify Configuration

### Backend App Checklist
- [ ] Application (client) ID copied
- [ ] Directory (tenant) ID copied
- [ ] Client secret value copied and stored securely
- [ ] API permissions added: `ApprovalSolution.ReadWrite`, `User.Read` (Delegated)
- [ ] Admin consent granted (green checkmarks)
- [ ] Type: Confidential client (but using delegated permissions)
- [ ] **Note**: Approvals API is BETA and doesn't support Application permissions

### Frontend App Checklist
- [ ] Application (client) ID copied
- [ ] Directory (tenant) ID copied (same as backend)
- [ ] Redirect URI configured: `http://localhost:3000`
- [ ] Platform type: Single-page application (SPA)
- [ ] API permissions added: `User.Read`, `ApprovalSolution.ReadWrite`, `ApprovalSolutionResponse.ReadWrite`
- [ ] Admin consent granted (green checkmarks)
- [ ] **Note**: Approvals API is currently in BETA

---

## Part 4: Update Application Configuration

### Backend Configuration

Edit `backend/.env`:
```env
TENANT_ID=<your-directory-tenant-id>
CLIENT_ID=<your-backend-client-id>
CLIENT_SECRET=<your-backend-client-secret>
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend Configuration

Edit `frontend/.env`:
```env
REACT_APP_CLIENT_ID=<your-frontend-client-id>
REACT_APP_TENANT_ID=<your-directory-tenant-id>
REACT_APP_REDIRECT_URI=http://localhost:3000
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_GRAPH_SCOPES=User.Read,ApprovalSolution.ReadWrite,ApprovalSolutionResponse.ReadWrite
```

---

## Troubleshooting

### Issue: Cannot Grant Admin Consent

**Symptom**: "Grant admin consent" button is grayed out or fails

**Solutions**:
- You need Global Administrator or Privileged Role Administrator permissions
- Ask your Azure AD admin to grant consent
- Alternative: Users can consent individually if org allows

### Issue: AADSTS50011 - Reply URL Mismatch

**Symptom**: Error during sign-in: "The reply URL specified in the request does not match"

**Solutions**:
- Verify redirect URI in Azure matches exactly: `http://localhost:3000`
- Check for trailing slashes or http vs https
- Ensure Platform type is "Single-page application (SPA)"

### Issue: AADSTS65001 - User Consent Required

**Symptom**: "The user or administrator has not consented to use the application"

**Solutions**:
- Grant admin consent in Azure Portal
- Or enable user consent in Azure AD settings

### Issue: Insufficient Privileges

**Symptom**: API calls return "Insufficient privileges to complete the operation"

**Solutions**:
- Verify admin consent is granted (green checkmarks)
- Ensure correct permissions are added (Application vs Delegated)
- Wait a few minutes for permissions to propagate

---

## Security Best Practices

1. **Client Secrets**:
   - Store in Azure Key Vault for production
   - Never commit secrets to source control
   - Rotate secrets regularly
   - Use short expiration periods

2. **Permissions**:
   - Only request necessary permissions
   - Use least privilege principle
   - Regularly audit permissions

3. **Multi-tenant Apps**:
   - This PoC uses single-tenant for security
   - Only allow multi-tenant if required

4. **Production Considerations**:
   - Use managed identities where possible
   - Implement certificate-based authentication
   - Enable Conditional Access policies
   - Monitor sign-in logs

---

## Additional Resources

- [Azure AD App Registration Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Graph Permissions Reference](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [MSAL.js Configuration](https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications)
- [Best Practices for Azure AD Apps](https://learn.microsoft.com/en-us/azure/active-directory/develop/identity-platform-integration-checklist)

---

**Next Step**: After completing the app registrations, proceed to configure your `.env` files and run the application as described in the main [README.md](../README.md).
