# Microsoft Graph Approvals API - Proof of Concept

This project is a full-stack Proof of Concept (PoC) demonstrating integration with the **Microsoft Graph Approvals API**. It allows users to create, view, and respond to approval requests through a custom web application.

## 🎯 Project Overview

The PoC consists of:
- **Frontend**: React application with MSAL authentication
- **Backend**: Node.js/Express server that interfaces with Microsoft Graph API
- **Authentication**: Microsoft Entra ID (Azure AD) using OAuth 2.0

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Microsoft 365 Developer Account** or access to an Azure tenant
- **Azure App Registration** (instructions below)

## 🚀 Getting Started

### Step 1: Azure App Registration

You need to register two applications in Azure Active Directory:

#### Backend App Registration (Confidential Client)
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations** > **New registration**
3. Configure:
   - **Name**: `Approvals-API-Backend`
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Leave blank for now
4. After creation, note the following:
   - **Application (client) ID**
   - **Directory (tenant) ID**
5. Go to **Certificates & secrets** > **New client secret**
   - Create a secret and **copy its value immediately**
6. Go to **API permissions**:
   - Add **Microsoft Graph** > **Application permissions**:
     - `ApprovalItems.ReadWrite.All`
     - `User.Read.All`
   - **Grant admin consent** for the permissions

#### Frontend App Registration (Public Client)
1. Create another app registration:
   - **Name**: `Approvals-API-Frontend`
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: 
     - Type: Single-page application (SPA)
     - URI: `http://localhost:3000`
2. Note the **Application (client) ID**
3. Go to **API permissions**:
   - Add **Microsoft Graph** > **Delegated permissions**:
     - `User.Read`
     - `ApprovalItems.ReadWrite.All`
   - **Grant admin consent**

### Step 2: Configure Backend

1. Navigate to the backend folder:
   ```powershell
   cd backend
   ```

2. Copy the example environment file:
   ```powershell
   Copy-Item .env.example .env
   ```

3. Edit `.env` and add your Azure App Registration details:
   ```
   TENANT_ID=your-tenant-id-here
   CLIENT_ID=your-backend-client-id-here
   CLIENT_SECRET=your-client-secret-here
   PORT=3001
   FRONTEND_URL=http://localhost:3000
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

3. Edit `.env` and add your frontend app details:
   ```
   REACT_APP_CLIENT_ID=your-frontend-client-id-here
   REACT_APP_TENANT_ID=your-tenant-id-here
   REACT_APP_REDIRECT_URI=http://localhost:3000
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_GRAPH_SCOPES=User.Read,ApprovalItems.ReadWrite.All
   ```

4. Install dependencies:
   ```powershell
   npm install
   ```

## ▶️ Running the Application

You need to run both backend and frontend servers:

### Start Backend Server

```powershell
cd backend
npm start
```

The backend will run on `http://localhost:3001`

### Start Frontend Application

Open a new terminal window:

```powershell
cd frontend
npm start
```

The frontend will open automatically at `http://localhost:3000`

## 🧪 Testing the PoC

1. **Sign In**: Click "Sign In with Microsoft" on the homepage
2. **View Approvals**: After signing in, you'll see the "My Approvals" tab
3. **Create Approval**: Switch to the "Create Approval" tab to create a new approval request
4. **Respond to Approvals**: Click "Approve" or "Reject" on any pending approval

## 📁 Project Structure

```
ApprovalAPI/
├── backend/
│   ├── routes/
│   │   └── approvals.js          # API routes for approvals
│   ├── services/
│   │   └── graphService.js       # Microsoft Graph API integration
│   ├── server.js                 # Express server setup
│   ├── package.json              # Backend dependencies
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
- ✅ Fetching approval items from Microsoft Graph
- ✅ Creating new approval requests
- ✅ Approving/rejecting approval requests
- ✅ Viewing approval responses
- ✅ Canceling approval requests

## 📚 API Endpoints

### Backend API

- `GET /api/approvals` - Get all approval items
- `GET /api/approvals/:id` - Get specific approval by ID
- `POST /api/approvals` - Create a new approval
- `POST /api/approvals/:id/respond` - Respond to an approval (approve/reject)
- `POST /api/approvals/:id/cancel` - Cancel an approval
- `GET /api/approvals/:id/responses` - Get responses for an approval

## 🔧 Troubleshooting

### Common Issues

**Issue**: "AADSTS50011: The reply URL specified in the request does not match"
- **Solution**: Ensure your redirect URI in Azure matches exactly: `http://localhost:3000`

**Issue**: "Insufficient privileges to complete the operation"
- **Solution**: Make sure admin consent is granted for all API permissions

**Issue**: Backend returns 500 errors
- **Solution**: Verify your `.env` file has correct tenant ID, client ID, and client secret

**Issue**: CORS errors
- **Solution**: Ensure backend `FRONTEND_URL` matches your frontend URL exactly

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
