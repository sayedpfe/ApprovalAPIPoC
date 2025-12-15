# Microsoft Graph Approvals API - Proof of Concept

This project is a simplified Proof of Concept (PoC) demonstrating integration with the **Microsoft Graph Approvals API**. It allows users to create, view, and respond to approval requests through a React web application.

## 🎯 Project Overview

The PoC consists of:
- **Frontend**: React application with MSAL authentication
- **API Integration**: Direct calls to Microsoft Graph API using delegated permissions
- **Authentication**: Microsoft Entra ID (Azure AD) using OAuth 2.0

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
│   ├── src/
│   │   ├── components/
│   │   │   ├── SignInSignOutButton.js    # Authentication UI
│   │   │   ├── ApprovalsList.js          # List and respond to approvals
│   │   │   └── CreateApproval.js         # Create new approvals
│   │   ├── services/
│   │   │   └── approvalService.js        # Microsoft Graph API calls
│   │   ├── App.js                        # Main application component
│   │   ├── authConfig.js                 # MSAL configuration
│   │   └── index.js                      # Application entry point
│   ├── package.json                      # Dependencies
│   └── .env                              # Environment variables
├── docs/
│   ├── AZURE_SETUP.md                    # Detailed Azure setup guide
│   └── API_REFERENCE.md                  # API documentation
└── README.md                             # This file
```
│   └── .env.example              # Environment variables template
│
├── frontend/
│   ├── public/
│   │   └── index.html            # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   ├── SignInSignOutButton.js
│   │   │   ├── ApprovalsList.js
│   │   │   └── CreateApproval.js
│   │   ├── services/
│   │   │   └── approvalService.js # Backend API client
│   │   ├── App.js                # Main application component
│   │   ├── authConfig.js         # MSAL configuration
│   │   └── index.js              # Application entry point
│   ├── package.json              # Frontend dependencies
│   └── .env.example              # Environment variables template
│
└── docs/
    └── API_REFERENCE.md          # API documentation
```

## 🔑 Key Features Demonstrated

- ✅ Microsoft Entra ID authentication using MSAL
- ✅ Direct Microsoft Graph API integration with delegated permissions
- ✅ Fetching approval items for the authenticated user
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

## 🔧 Troubleshooting

### Common Issues

**Issue**: "AADSTS50011: The reply URL specified in the request does not match"
- **Solution**: Ensure your redirect URI in Azure matches exactly: `http://localhost:3000`

**Issue**: "Insufficient privileges to complete the operation"
- **Solution**: Make sure admin consent is granted for all API permissions in Azure portal

**Issue**: Seeing all approvals from different users
- **Solution**: This is expected behavior - the API returns approvals where the user is an approver or owner

## 📖 Additional Resources

- [Microsoft Graph Approvals API Documentation](https://learn.microsoft.com/en-us/graph/approvals-app-api)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
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
