# Session Notes - January 22-23, 2026

## What We Accomplished

### ✅ Backend Deployment to Azure
1. Deployed backend to Azure App Service: `approvals-backend-api-7619`
2. Configured Managed Identity for secure Cosmos DB access (no keys!)
3. Set up RBAC permissions for both Managed Identity and local development
4. Resolved multiple deployment issues:
   - Missing node_modules (extracted from tar.gz)
   - Local authentication disabled → Switched to Azure AD
   - Cosmos DB firewall → Enabled public access
   - RBAC permissions → Assigned Data Contributor + Account Contributor roles
   - Database creation → Created manually in Azure Portal

### ✅ Cosmos DB Configuration
- **Account**: `approvals-cosmos-db`
- **Database**: `ApprovalsDB`
- **Container**: `ApprovalMetadata` (partition key: `/approvalId`)
- **Authentication**: Azure AD with Managed Identity
- **Network**: Public access enabled for development

### ✅ Azure AD App Registration
- **App Name**: "Approvals Frontend App"
- **Client ID**: `59544f38-a3b7-4916-b48b-bf06a7268520`
- **Tenant ID**: `b22f8675-8375-455b-941a-67bee4cf7747`
- **Platform**: Single Page Application (SPA)
- **Redirect URI**: http://localhost:3000
- **Permissions**: User.Read

### ✅ Frontend Configuration
- Created `frontend/.env` with Azure AD credentials
- Updated `frontend/src/index.js` to properly initialize MSAL
- Configured to use Azure backend URL: https://approvals-backend-api-7619.azurewebsites.net

### ✅ Backend Configuration
- Created `backend/.env` for local development
- Configured to use Azure AD authentication (USE_AZURE_AD_AUTH=true)
- Installed @azure/identity package for DefaultAzureCredential
- Updated cosmosDbService.js to support both key-based and Azure AD auth

## Current Status

### Working ✅
- Backend deployed to Azure and responding to health checks
- Local backend can connect to Azure Cosmos DB using Azure CLI credentials
- Azure backend using Managed Identity to connect to Cosmos DB
- Frontend configured with Azure AD authentication
- CORS configured for localhost:3000

### In Progress 🔄
- Frontend authentication flow (MSAL initialization updated, needs testing)
- Sign-in popup closes but UI not updating (awaiting verification after SPA platform configuration)

## Key Files Modified

1. **backend/services/cosmosDbService.js**
   - Added support for Azure AD authentication via DefaultAzureCredential
   - Falls back to Azure AD if no key provided

2. **backend/.env** (local development)
   ```env
   PORT=3001
   NODE_ENV=development
   COSMOS_ENDPOINT=https://approvals-cosmos-db.documents.azure.com:443/
   COSMOS_DATABASE_ID=ApprovalsDB
   COSMOS_CONTAINER_ID=ApprovalMetadata
   USE_AZURE_AD_AUTH=true
   FRONTEND_URL=http://localhost:3000
   ```

3. **frontend/.env**
   ```env
   REACT_APP_BACKEND_URL=https://approvals-backend-api-7619.azurewebsites.net
   REACT_APP_CLIENT_ID=59544f38-a3b7-4916-b48b-bf06a7268520
   REACT_APP_TENANT_ID=b22f8675-8375-455b-941a-67bee4cf7747
   REACT_APP_REDIRECT_URI=http://localhost:3000
   REACT_APP_GRAPH_SCOPES=User.Read
   ```

4. **frontend/src/index.js**
   - Updated to properly initialize MSAL
   - Added event callback for LOGIN_SUCCESS
   - Sets active account after successful authentication

## Azure Resources

### App Service
- **Name**: approvals-backend-api-7619
- **Resource Group**: rg-approvals-poc
- **URL**: https://approvals-backend-api-7619.azurewebsites.net
- **Runtime**: Node 20-lts on Linux
- **Tier**: Free (F1)
- **Region**: West US 2

### Managed Identity
- **Type**: System-assigned
- **Principal ID**: 1c08c520-41a3-45aa-9bad-9ae9b2c91eaa
- **RBAC Roles**:
  - Cosmos DB Built-in Data Contributor
  - DocumentDB Account Contributor

### User RBAC (for local development)
- **User Principal**: 1a5bfda8-d02c-476a-81ef-f9ee2367c239
- **Roles**: Same as Managed Identity

### App Service Configuration
```bash
NODE_ENV=production
USE_AZURE_AD_AUTH=true
COSMOS_ENDPOINT=https://approvals-cosmos-db.documents.azure.com:443/
COSMOS_DATABASE_ID=ApprovalsDB
COSMOS_CONTAINER_ID=ApprovalMetadata
PORT=8080
FRONTEND_URL=http://localhost:3000
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true
```

## Troubleshooting Steps Taken

1. **Issue**: Backend returned "Application Error"
   - **Solution**: Downloaded logs via `az webapp log download`

2. **Issue**: "Local Authorization is disabled"
   - **Solution**: Updated to use Azure AD authentication

3. **Issue**: Missing node_modules after deployment
   - **Solution**: Extracted node_modules.tar.gz via Kudu console

4. **Issue**: "Request originated from IP through public internet"
   - **Solution**: Enabled public network access in Cosmos DB

5. **Issue**: RBAC permission errors
   - **Solution**: Assigned proper roles to both Managed Identity and user account

6. **Issue**: "does not have required RBAC permissions to perform action [Microsoft.DocumentDB/databaseAccounts/sqlDatabases/write]"
   - **Solution**: Manually created database and container in Azure Portal

7. **Issue**: Frontend sign-in popup closes but UI doesn't update
   - **Solution**: Updated App Registration to SPA platform + Updated MSAL initialization in index.js

## Next Steps

1. **Frontend Authentication** (Current Issue)
   - Verify SPA platform configuration in Azure Portal
   - Test sign-in flow with updated MSAL initialization
   - Confirm UI updates after successful authentication

2. **Test End-to-End Flow**
   - Sign in successfully
   - View approvals list (will be empty initially)
   - Create a new approval with metadata
   - Verify data is stored in Cosmos DB

3. **OneDrive Integration**
   - Set up OneDrive permissions for file attachments
   - Follow docs/ONEDRIVE_SETUP.md
   - Add Files.ReadWrite permissions to App Registration
   - Test file upload functionality

4. **Production Readiness** (Optional)
   - Upgrade App Service to Basic tier for always-on
   - Enable Application Insights for monitoring
   - Configure firewall rules on Cosmos DB
   - Set up CI/CD pipeline with GitHub Actions
   - Deploy frontend to Azure Static Web Apps

## Important Commands

### Check backend health
```bash
curl https://approvals-backend-api-7619.azurewebsites.net/health
```

### View Azure backend logs
```bash
az webapp log download --name "approvals-backend-api-7619" --resource-group "rg-approvals-poc"
```

### Restart Azure backend
```bash
az webapp restart --name "approvals-backend-api-7619" --resource-group "rg-approvals-poc"
```

### View Cosmos DB data
- Go to Azure Portal → approvals-cosmos-db → Data Explorer → ApprovalsDB → ApprovalMetadata

## Documentation Created

- **docs/AZURE_DEPLOYMENT.md**: Complete deployment guide (357 lines)
- **docs/COSMOS_DB_SETUP.md**: Already existed, still valid
- **docs/AZURE_SETUP.md**: App Registration setup guide

## Security Notes

- ✅ No secrets in code (using Managed Identity)
- ✅ .env files in .gitignore
- ✅ RBAC roles properly assigned
- ⚠️  Public network access enabled on Cosmos DB (restrict for production)
- ⚠️  Using Free tier App Service (no always-on, may sleep)

## Cost Estimate

- **Cosmos DB Serverless**: ~$0-5/month (free tier applied)
- **App Service Free**: $0/month
- **Total**: ~$0-5/month for this PoC

---

**Last Updated**: January 23, 2026
**Session Duration**: ~2 days (with breaks)
**Status**: Backend deployed ✅, Frontend auth in progress 🔄
