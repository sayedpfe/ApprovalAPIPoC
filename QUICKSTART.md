# Quick Start Guide

Get your Microsoft Graph Approvals API PoC up and running in 5 minutes!

## Prerequisites
- Node.js installed (v16+)
- Azure tenant with admin access
- 10 minutes for Azure setup

## Quick Setup Steps

### 1. Azure App Registration (5 min)
Follow [docs/AZURE_SETUP.md](docs/AZURE_SETUP.md) to create:
- Backend app (confidential client)
- Frontend app (SPA)

You'll need:
- 2 Client IDs
- 1 Tenant ID  
- 1 Client Secret

### 2. Configure Backend

```powershell
cd backend
Copy-Item .env.example .env
# Edit .env and add your Azure values
npm install
```

### 3. Configure Frontend

```powershell
cd ..\frontend
Copy-Item .env.example .env
# Edit .env and add your Azure values
npm install
```

### 4. Run the Application

**Terminal 1 - Backend:**
```powershell
cd backend
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm start
```

### 5. Test It!

1. Open http://localhost:3000
2. Click "Sign In with Microsoft"
3. Create an approval request
4. View your approvals

## What's Included?

✅ Microsoft authentication (MSAL)  
✅ Create approval requests  
✅ View approval items  
✅ Approve/reject requests  
✅ Full Microsoft Graph integration  

## Need Help?

- **Full setup guide**: [README.md](README.md)
- **Azure configuration**: [docs/AZURE_SETUP.md](docs/AZURE_SETUP.md)
- **API reference**: [docs/API_REFERENCE.md](docs/API_REFERENCE.md)

## Common Issues

**"Reply URL mismatch"** → Check redirect URI is exactly `http://localhost:3000`  
**"Insufficient privileges"** → Grant admin consent in Azure Portal  
**Backend 500 errors** → Verify `.env` credentials are correct  

---

🎉 That's it! You now have a working Approvals API PoC.
