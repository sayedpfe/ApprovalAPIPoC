# Quick Start Guide - Cosmos DB & OneDrive Integration

This guide will help you quickly set up the enhanced Approvals API PoC with Azure Cosmos DB and OneDrive file attachments.

## What's New

✨ **Azure Cosmos DB** - Store custom metadata (sequential approvals, due dates) in the cloud  
✨ **OneDrive Integration** - Upload attachments to creator's OneDrive and auto-share with approvers  
✨ **Backend API** - Secure Node.js/Express server for database and file operations  

## Architecture Overview

```
Before: Frontend → localStorage (limited, local only)
Now:    Frontend → Backend API → Cosmos DB + OneDrive (cloud-based, shareable)
```

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Azure subscription (free tier works!)
- [ ] Azure App Registration (already have from frontend)
- [ ] 30 minutes for setup

## Step-by-Step Setup

### 1️⃣ Set Up Azure Cosmos DB (10 minutes)

**Follow the detailed guide**: [COSMOS_DB_SETUP.md](../docs/COSMOS_DB_SETUP.md)

**Quick version:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Create new resource → "Azure Cosmos DB"
3. Choose:
   - API: **Core (SQL)**
   - Capacity mode: **Serverless** (free tier)
4. Get your:
   - Endpoint URL (e.g., `https://your-db.documents.azure.com:443/`)
   - Primary Key (from "Keys" section)

### 2️⃣ Configure Backend (5 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env with your Cosmos DB credentials
notepad .env
```

**Update `.env` with your values:**
```env
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=paste-your-primary-key-here
COSMOS_DATABASE_ID=ApprovalsDB
COSMOS_CONTAINER_ID=ApprovalMetadata
```

**Start the backend:**
```bash
npm start
```

You should see:
```
✅ Server running on http://localhost:3001
✅ Cosmos DB initialized successfully
```

### 3️⃣ Add OneDrive Permissions (5 minutes)

**Follow the detailed guide**: [ONEDRIVE_SETUP.md](../docs/ONEDRIVE_SETUP.md)

**Quick version:**
1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Select your app
3. API permissions → Add permission → Microsoft Graph → Delegated
4. Add:
   - `Files.ReadWrite`
   - `Files.ReadWrite.All`
5. Grant admin consent

### 4️⃣ Update Frontend Configuration (2 minutes)

**Update `frontend/src/authConfig.js`:**
```javascript
export const loginRequest = {
  scopes: [
    'User.Read',
    'User.Read.All',
    'ApprovalSolution.ReadWrite',
    'ApprovalSolutionResponse.ReadWrite',
    'Files.ReadWrite',        // NEW
    'Files.ReadWrite.All'     // NEW
  ]
};
```

**Create `frontend/.env`:**
```env
REACT_APP_BACKEND_URL=http://localhost:3001
```

**Restart frontend** if already running:
```bash
cd frontend
npm start
```

### 5️⃣ Test Everything (5 minutes)

1. **Open browser**: http://localhost:3000
2. **Sign in** with your Microsoft account
3. **Create an approval**:
   - Add title, description
   - Add approvers
   - Set due date
   - Enable sequential approvals
   - **Upload a file** (PDF, image, etc.)
4. **Click Submit**

**What happens:**
- ✅ Approval created in Microsoft Graph API
- ✅ Custom metadata saved to Cosmos DB
- ✅ File uploaded to your OneDrive `/Approvals/` folder
- ✅ File automatically shared with approvers
- ✅ Approvers get email notification with file link

### 6️⃣ Verify in Azure Portal

**Check Cosmos DB:**
1. Azure Portal → Your Cosmos DB account
2. Data Explorer → ApprovalsDB → ApprovalMetadata
3. You should see your approval metadata!

**Check OneDrive:**
1. Go to [OneDrive](https://onedrive.com)
2. Look for `/Approvals/` folder
3. Your uploaded files should be there

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend connects to backend
- [ ] Can create approval without files
- [ ] Can create approval with files
- [ ] Files appear in OneDrive
- [ ] Metadata appears in Cosmos DB
- [ ] Approvers can view files

## Common Issues & Solutions

### ❌ Backend: "Cosmos DB endpoint and key must be configured"
**Solution:** Check `.env` file exists and has correct values

### ❌ Frontend: "Network Error" when creating approval
**Solution:** 
- Ensure backend is running (`npm start` in backend folder)
- Check `REACT_APP_BACKEND_URL` in frontend `.env`

### ❌ File upload fails: "Insufficient privileges"
**Solution:**
- Add `Files.ReadWrite` permission in Azure App Registration
- Grant admin consent
- Sign out and sign in again

### ❌ "Failed to share file"
**Solution:**
- Add `Files.ReadWrite.All` permission
- Verify approver email addresses are correct

### ❌ Backend won't start: "Port 3001 already in use"
**Solution:**
```bash
# Find and kill process using port 3001
netstat -ano | findstr :3001
# Or change PORT in .env to 3002
```

## Migration from localStorage

**Current users:** Your existing approvals with localStorage will still work! The new backend system works alongside it.

**To migrate:**
1. Export localStorage data (browser console):
   ```javascript
   console.log(localStorage.getItem('approvalMetadata'));
   ```
2. Backend will be used for new approvals automatically
3. Old approvals continue using localStorage

## Cost Estimate

### Azure Cosmos DB (Serverless)
- First 1M operations: **FREE** (with free tier)
- Storage (25 GB): **FREE**
- Estimated monthly cost for PoC: **$0-5**

### OneDrive
- Included with Microsoft 365 subscription
- No additional cost for storage/sharing

### Total: ~$0-5/month for testing

## Next Steps

Now that everything is set up:

1. ✅ **Test basic flow** - Create approval with attachments
2. ✅ **Verify approver access** - Check if approvers can view files
3. ✅ **Test sequential approvals** - Create multi-stage approval
4. ✅ **Monitor Cosmos DB** - View data in Azure Portal
5. 🚀 **Deploy to production** - See deployment guides

## Architecture Benefits

| Feature | Before (localStorage) | After (Cosmos DB + OneDrive) |
|---------|----------------------|------------------------------|
| Storage | Browser only | Cloud-based |
| Sharing | Not possible | Automatic with approvers |
| Access | Single device | Any device |
| Files | Metadata only | Real file storage |
| Scalability | Limited | Enterprise-grade |
| Backup | None | Azure handles it |
| Security | Browser-based | Azure security |

## File Upload Flow Diagram

```
1. User selects files
       ↓
2. Frontend sends to backend
       ↓
3. Backend uploads to OneDrive
   (Creator's /Approvals/{id}/ folder)
       ↓
4. Backend creates sharing links
       ↓
5. Backend invites approvers
   (They get email notification)
       ↓
6. Backend saves metadata to Cosmos DB
   (File URLs, names, sizes)
       ↓
7. Frontend displays success
```

## Additional Resources

### Detailed Guides
- [Cosmos DB Setup](../docs/COSMOS_DB_SETUP.md)
- [OneDrive Integration](../docs/ONEDRIVE_SETUP.md)
- [Backend README](../backend/README.md)
- [API Reference](../docs/API_REFERENCE.md)

### Microsoft Documentation
- [Cosmos DB Docs](https://learn.microsoft.com/en-us/azure/cosmos-db/)
- [OneDrive API](https://learn.microsoft.com/en-us/graph/api/resources/onedrive)
- [Microsoft Graph](https://learn.microsoft.com/en-us/graph/)

### Video Tutorials (Coming Soon)
- Setting up Cosmos DB
- Configuring OneDrive permissions
- End-to-end demo

## Support

**Issues?** 
1. Check the troubleshooting section above
2. Review detailed setup guides in `/docs`
3. Check backend logs for errors
4. Create GitHub issue with error details

**Questions?**
- Review the architecture documentation
- Check Microsoft Graph API documentation
- Ask in discussions

## Success! 🎉

If you completed all steps, you now have:
- ✅ Backend API running
- ✅ Cosmos DB storing metadata
- ✅ OneDrive handling file attachments
- ✅ Automatic file sharing with approvers
- ✅ Enterprise-grade approval system

**Ready to create your first cloud-backed approval request!**
