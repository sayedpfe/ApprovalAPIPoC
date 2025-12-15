# Microsoft Graph Approvals API - Proof of Concept

This project is a simplified Proof of Concept (PoC) demonstrating integration with the **Microsoft Graph Approvals API**. It allows users to create, view, respond to, and cancel approval requests through a React web application.

> **📊 [View Complete Feature Analysis](docs/FEATURE_ANALYSIS.md)** - Comprehensive breakdown of implemented features vs. available API capabilities, including priority roadmap and known limitations.

## 🎯 Project Overview

The PoC consists of:
- **Frontend**: React application with MSAL authentication
- **API Integration**: Direct calls to Microsoft Graph API using delegated permissions
- **Authentication**: Microsoft Entra ID (Azure AD) using OAuth 2.0
- **Coverage**: ~40% of available Approvals API features implemented

**Why No Backend?**
The Microsoft Graph Approvals API only supports **delegated permissions** (user context), so the React app calls the API directly with the user's authentication token. This keeps the architecture simple and efficient.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Microsoft 365 Developer Account** or access to an Azure tenant
- **Azure App Registration** (instructions below)

## 🚀 Getting Started

### Step 1: Azure App Registration

You need to register ONE application in Azure Active Directory:

#### App Registration (Single Page Application)
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations** > **New registration**
3. Configure:
   - **Name**: `Approvals-API-PoC`
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: 
     - Type: Single-page application (SPA)
     - URI: `http://localhost:3000`
4. After creation, note the following:
   - **Application (client) ID**
   - **Directory (tenant) ID**
5. Go to **API permissions**:
   - Add **Microsoft Graph** > **Delegated permissions**:
     - `User.Read`
     - `ApprovalSolution.ReadWrite`
     - `ApprovalSolutionResponse.ReadWrite`
   - Click **Grant admin consent** for your organization

⚠️ **Important**: The Approvals API is in BETA and only supports **delegated permissions** (user context), not application permissions.

### Step 2: Configure Frontend

1. Navigate to the frontend folder:
   ```powershell
   cd frontend
   ```

2. Copy the example environment file:
   ```powershell
   Copy-Item .env.example .env
   ```

3. Edit `.env` and add your Azure App Registration details:
   ```
   REACT_APP_CLIENT_ID=your-client-id-here
   REACT_APP_TENANT_ID=your-tenant-id-here
   ```

4. Install dependencies:
   ```powershell
   npm install
   ```

### Step 3: Configure Frontend

1. Navigate to the frontend folder:
   ```powershell
   cd ..\frontend
   ```

2. Copy the example environment file:
   ```powershell
   Copy-Item .env.example .env
   ```

3. Install dependencies (if not already done):
   ```powershell
   npm install
   ```

## ▶️ Running the Application

```powershell
cd frontend
npm start
```

The application will open automatically at `http://localhost:3000`

## 🧪 Testing the PoC

1. **Sign In**: Click "Sign In with Microsoft" on the homepage
2. **View Approvals**: After signing in, you'll see the "My Approvals" tab
3. **Create Approval**: Switch to the "Create Approval" tab to create a new approval request
4. **Respond to Approvals**: Click "Approve" or "Reject" on any pending approval

## 📁 Project Structure

```
ApprovalAPI/
├── frontend/
│   ├── public/
│   │   └── index.html            # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   ├── SignInSignOutButton.js    # Authentication UI
│   │   │   ├── ApprovalsList.js          # List/respond/cancel approvals (4-tab view)
│   │   │   └── CreateApproval.js         # Create new approval requests
│   │   ├── services/
│   │   │   └── approvalService.js        # Microsoft Graph API integration
│   │   ├── App.js                        # Main application component
│   │   ├── authConfig.js                 # MSAL configuration
│   │   └── index.js                      # Application entry point
│   ├── package.json                      # Dependencies
│   └── .env.example                      # Environment variables template
│
└── docs/
    ├── API_REFERENCE.md                  # API endpoint documentation
    ├── APPROVALS_API_NOTES.md            # API quirks and troubleshooting
    ├── AZURE_SETUP.md                    # Azure configuration guide
    ├── FEATURE_ANALYSIS.md               # ⭐ Complete feature breakdown & roadmap
    └── BACKEND_ISSUE.md                  # Architecture decision notes

### Core Functionality
- ✅ **Microsoft Entra ID authentication** using MSAL
- ✅ **Create approval requests** with multiple approvers
- ✅ **Approve/Reject approvals** with API responses
- ✅ **Cancel pending approvals** as owner
- ✅ **Four-tab organization**: Pending/Completed views for both approver and owner roles
- ✅ **Support for multiple approval types**: basic (any approver) and basicAwaitAll (all must approve)

### API Integration
- ✅ Direct Microsoft Graph API integration with delegated permissions
- ✅ `GET /approvalItems` - List all accessible approvals
- ✅ `POST /approvalItems` - Create new approval
- ✅ `GET /approvalItems/{id}` - Get specific approval
- ✅ `POST /approvalItems/{id}/cancel` - Cancel approval
- ✅ `GET /approvalItems/{id}/requests` - Get approval requests
- ✅ `POST /approvalItems/{id}/responses` - Submit response

## 🚧 Known Limitations

### ❌ Not Supported by API
- **File Attachments** - API does not support file attachments on creation or response
  - **Workaround**: Use OneDrive/SharePoint links in description field
  - See [Feature Analysis](docs/FEATURE_ANALYSIS.md) for detailed workaround strategies

### 📈 Not Yet Implemented (Available in API)
High-value features available for future enhancement:
- Custom response options (beyond Approve/Reject)
- Email notification toggles
- Response comments dialog
- Complete audit trail/history
- Advanced search and filtering
- Dashboard and analytics
- Mobile-responsive design

**👉 [See Complete Feature Analysis](docs/FEATURE_ANALYSIS.md)** for prioritized roadmap and implementation guidance.r the authenticated user
- ✅ Creating new approval requests
- ✅ Approving/rejecting approval requests
- ✅ Viewing approval responses

## 🏗️ Architecture

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │ (1) Sign In
         ▼
┌─────────────────┐
│   React App     │
│   + MSAL Auth   │
└────────┬────────┘
         │ (2) Get Access Token
         │ (3) API Calls with Token
         ▼
┌─────────────────┐
│ Microsoft Graph │
│  Approvals API  │
│ (/beta/...)     │
└─────────────────┘
```

**Flow:**
1. User signs in via MSAL → Gets authenticated with Microsoft Entra ID
2. MSAL acquires access token with delegated permissions
3. React app calls Microsoft Graph API directly with the user's token
4. API returns data based on user's permissions and context

## 🔧 Documentation & Resources

### Project Documentation
- **[Feature Analysis](docs/FEATURE_ANALYSIS.md)** ⭐ - Complete API feature breakdown, implementation priorities, and roadmap
- **[API Reference](docs/API_REFERENCE.md)** - Endpoint documentation and usage examples
- **[Approvals API Notes](docs/APPROVALS_API_NOTES.md)** - Troubleshooting guide and API quirks
- **[Azure Setup Guide](docs/AZURE_SETUP.md)** - Detailed Azure configuration instructions

### External Resources
- [Microsoft Graph Approvals API Documentation](https://learn.microsoft.com/en-us/graph/api/resources/approvalitem?view=graph-rest-beta)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Microsoft Graph JavaScript SDK](https://github.com/microsoftgraph/msgraph-sdk-javascript)

## 🤝 Contributing & Enhancement Ideas

This is a PoC project with **60% of API features still available** for implementation. 

**High-Priority Enhancements** (see [Feature Analysis](docs/FEATURE_ANALYSIS.md)):
1. **OneDrive/SharePoint file link integration** - Workaround for attachment limitation
2. **Custom response options** - Beyond Approve/Reject
3. **Email notifications** - Toggle for approval notifications
### Immediate Priorities
1. **Implement file link workaround** - Use OneDrive/SharePoint links for attachments
2. **Add custom response options** - Flexible response types
3. **Enable email notifications** - User engagement

### Production Readiness
To move this PoC to production:
1. Implement comprehensive error handling and logging
2. Add unit and integration tests
3. Set up CI/CD pipelines
4. Configure production Azure App Services
5. Implement security best practices (HTTPS, CSP, CORS)
6. Add monitoring and application insights
7. Implement caching strategies
8. Add input validation and sanitization
9. Performance optimization
10. Accessibility compliance (WCAG 2.1)

### Feature Roadmap
**Phase 1 (Must Have)**
- File link integration with OneDrive/SharePoint
- Custom response prompts
- Email notification controls
- Advanced search and filtering
- Basic analytics dashboard

**Phase 2 (Should Have)**
- Complete audit trail
- Bulk operations
- Mobile-responsive design
- Real-time updates
- Approver status display

See **[Complete Feature Analysis](docs/FEATURE_ANALYSIS.md)** for detailed implementation guidance.

---

## ⚠️ Important Notes

- **API Status**: Beta only - not available in Microsoft Graph v1.0
- **Permissions**: Only supports delegated (user context) permissions
- **Attachments**: Not supported by API - use file link workaround
- **Production Use**: Beta APIs are subject to change without notice

---

**Need Help?** 
- Check the **[Feature Analysis](docs/FEATURE_ANALYSIS.md)** for implementation guidance
- Review **[API Notes](docs/APPROVALS_API_NOTES.md)** for troubleshooting
- Consult [Microsoft Graph Approvals API documentation](https://learn.microsoft.com/en-us/graph/api/resources/approvalitem?view=graph-rest-beta)
- Create an issue in this repository
- [Microsoft Graph JavaScript SDK](https://github.com/microsoftgraph/msgraph-sdk-javascript)

## 🤝 Contributing

This is a PoC project. Feel free to extend it with additional features such as:
- Filtering and sorting approvals
- Real-time notifications
- Approval workflows
- Role-based access control
- Audit logging

## 📝 License

This project is for demonstration purposes only.

## 💡 Next Steps

To move this PoC to production:
1. Implement proper error handling and logging
2. Add unit and integration tests
3. Set up CI/CD pipelines
4. Configure production Azure App Services
5. Implement proper security measures (HTTPS, CSP, etc.)
6. Add monitoring and analytics
7. Implement caching strategies
8. Add comprehensive input validation

---

**Need Help?** Check the [Microsoft Graph Approvals API documentation](https://learn.microsoft.com/en-us/graph/approvals-app-api) or create an issue in this repository.
