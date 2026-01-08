# Project Documentation Update - January 8, 2026

## 🎉 Major Update: Azure Integration Complete

The Approvals API PoC has been significantly enhanced with Azure cloud services integration.

## What Changed

### Before: Frontend-Only (localStorage)
- ✅ Basic approval operations via Microsoft Graph API
- ❌ Custom metadata stored locally in browser
- ❌ No file attachment support
- ❌ Data lost if browser clears storage
- ❌ No cross-device access

### After: Full Azure Integration
- ✅ Basic approval operations via Microsoft Graph API (unchanged)
- ✅ Custom metadata stored in **Azure Cosmos DB**
- ✅ File attachments uploaded to **OneDrive**
- ✅ Files automatically shared with approvers
- ✅ Cloud-based, accessible from anywhere
- ✅ Enterprise-grade scalability and security

## New Components

### Backend API (`/backend`)
- **Technology**: Node.js/Express
- **Port**: 3001
- **Purpose**: Handle Cosmos DB operations and OneDrive file uploads

#### Files Created:
- `server.js` - Main Express server
- `routes/metadata.js` - API endpoints for metadata CRUD
- `services/cosmosDbService.js` - Cosmos DB operations
- `services/oneDriveService.js` - File upload and sharing
- `package.json` - Dependencies
- `.env.example` - Configuration template
- `README.md` - Backend documentation

### Frontend Updates (`/frontend`)
- New component: `ApprovalDetails.js` - Detailed approval view
- New service: `approvalMetadataService-backend.js` - Backend API client
- Updated: `CreateApproval.js` - File upload support
- Updated: `ApprovalsList.js` - View details button
- Updated: `App.js` - Navigation to details view
- Updated: `authConfig.js` - Added OneDrive permissions

### Documentation (`/docs`)
- **NEW**: `COSMOS_DB_SETUP.md` - Step-by-step Cosmos DB configuration
- **NEW**: `ONEDRIVE_SETUP.md` - OneDrive permissions and file sharing guide
- **NEW**: `QUICK_START_AZURE.md` - Complete quick start (30 minutes)
- **Updated**: All existing docs to reflect new architecture

## Features Added

### 1. Due Dates with Overdue Tracking
- **Storage**: Azure Cosmos DB
- **UI**: Date/time picker in create form
- **Display**: Overdue dates highlighted in red
- **Badge**: Marked as "Custom" feature

### 2. Sequential Multi-Stage Approvals
- **Storage**: Stage assignments in Cosmos DB
- **UI**: Toggle to enable sequential mode
- **Display**: Stage numbers shown with each approver
- **Tracking**: Frontend tracks approval order

### 3. File Attachments
- **Storage**: Creator's OneDrive (`/Approvals/{approvalId}/`)
- **Upload**: Handled by backend via Microsoft Graph API
- **Sharing**: Automatic permission grants to all approvers
- **Notifications**: Approvers receive email with file access
- **Size Limit**: 50MB per file (configurable)
- **Types**: All file types supported

### 4. Automatic File Sharing
- **Process**: 
  1. File uploaded to creator's OneDrive
  2. Sharing link created (organization-wide)
  3. Individual permissions granted to each approver
  4. Email invitation sent to approvers
  5. Metadata with links saved to Cosmos DB

### 5. Custom Metadata Storage
- **Database**: Azure Cosmos DB (serverless tier)
- **Structure**: JSON documents with partition key `/approvalId`
- **Data**: Due dates, sequential settings, file references
- **Access**: RESTful API via backend

### 6. Detailed Approval View
- **Component**: ApprovalDetails.js
- **Features**:
  - Full approval information
  - Custom metadata display
  - File attachments with download links
  - Approver list with responses
  - Response capability (approve/reject with comments)
  - Back navigation to list

## Architecture Changes

### API Call Patterns

**Pattern 1: Direct to Microsoft Graph (unchanged)**
```
Frontend → Microsoft Graph API
```
Used for:
- Create approval
- List approvals
- Approve/reject
- Cancel approval

**Pattern 2: Through Backend (NEW)**
```
Frontend → Backend API → Cosmos DB
Frontend → Backend API → OneDrive (via Graph)
```
Used for:
- Save custom metadata
- Upload file attachments
- Retrieve custom metadata
- Share files with approvers

## Setup Requirements

### Azure Resources Needed

1. **Azure App Registration** (existing - updated)
   - Additional permissions: `Files.ReadWrite`, `Files.ReadWrite.All`

2. **Azure Cosmos DB** (NEW)
   - Account: Serverless mode recommended
   - Database: `ApprovalsDB` (auto-created)
   - Container: `ApprovalMetadata` (auto-created)
   - Cost: ~$0-5/month for testing

3. **OneDrive** (existing)
   - Included with Microsoft 365
   - No additional cost

### Configuration Files

**Backend `.env`:**
```env
PORT=3001
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=your-primary-key
COSMOS_DATABASE_ID=ApprovalsDB
COSMOS_CONTAINER_ID=ApprovalMetadata
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env`:**
```env
REACT_APP_CLIENT_ID=your-client-id
REACT_APP_TENANT_ID=your-tenant-id
REACT_APP_BACKEND_URL=http://localhost:3001
```

## API Endpoints (Backend)

### Metadata Operations
- `POST /api/metadata` - Save metadata
- `GET /api/metadata/:approvalId` - Get metadata
- `GET /api/metadata?creatorEmail=...` - List metadata
- `PATCH /api/metadata/:approvalId` - Update metadata
- `DELETE /api/metadata/:approvalId` - Delete metadata

### File Operations
- `POST /api/metadata/:approvalId/attachments` - Upload files to OneDrive

### Health Check
- `GET /health` - Server health status

## Data Models

### Approval Metadata (Cosmos DB)
```json
{
  "id": "approval-123",
  "approvalId": "approval-123",
  "dueDate": "2026-01-15T10:00:00Z",
  "isSequential": true,
  "approversWithStages": [
    { "email": "user1@example.com", "stage": 1 },
    { "email": "user2@example.com", "stage": 2 }
  ],
  "attachments": [
    {
      "id": "file-id",
      "name": "document.pdf",
      "size": 1024000,
      "webUrl": "https://...",
      "sharingLink": "https://...",
      "uploadedAt": "2026-01-08T..."
    }
  ],
  "creatorEmail": "creator@example.com",
  "createdAt": "2026-01-08T...",
  "updatedAt": "2026-01-08T..."
}
```

## Security Considerations

### Access Tokens
- Frontend obtains user's access token via MSAL
- Token passed to backend for OneDrive operations
- Backend uses token immediately, never stores it
- Tokens expire after 1 hour (MSAL handles refresh)

### Database Credentials
- Cosmos DB keys stored in backend `.env`
- Never exposed to frontend
- `.env` in `.gitignore`

### File Permissions
- Files uploaded to creator's OneDrive
- Explicit permissions granted to approvers only
- Organization-scoped sharing links

### CORS
- Backend only accepts requests from configured frontend URL
- Production: Update to HTTPS frontend URL

## Testing Checklist

- [ ] Backend starts successfully
- [ ] Frontend connects to backend
- [ ] Can create approval without files
- [ ] Can create approval with files
- [ ] Files upload to OneDrive
- [ ] Approvers receive file access
- [ ] Metadata saves to Cosmos DB
- [ ] Can view approval details
- [ ] Can approve/reject from details view
- [ ] Due dates display correctly
- [ ] Overdue dates highlighted
- [ ] Sequential stages display correctly

## Migration Notes

### Backward Compatibility
- Old approvals using localStorage still work
- New approvals use Cosmos DB + OneDrive
- No data migration needed
- localStorage code kept for reference

### Switching to Backend
The frontend now checks for backend availability:
- If backend running: Uses Cosmos DB + OneDrive
- If backend offline: Falls back to localStorage (optional)

## Performance

### Expected Response Times
- Save metadata: ~100-300ms
- Get metadata: ~50-150ms
- File upload (5MB): ~2-5 seconds
- File sharing: ~1-2 seconds per approver

### Scalability
- Cosmos DB: Auto-scales with serverless tier
- OneDrive: Microsoft's infrastructure
- Backend: Can scale horizontally with load balancer

## Cost Breakdown

### Development/Testing
- Cosmos DB: $0-5/month (free tier available)
- OneDrive: Included with M365
- **Total: ~$0-5/month**

### Production (estimated for 100 users)
- Cosmos DB: ~$10-20/month
- OneDrive: Included with M365
- App Service: ~$50/month (if using Azure App Service)
- **Total: ~$60-70/month**

## Documentation Structure

```
docs/
├── QUICK_START_AZURE.md     ⭐ START HERE - Complete setup
├── COSMOS_DB_SETUP.md        - Cosmos DB configuration
├── ONEDRIVE_SETUP.md         - OneDrive permissions
├── AZURE_SETUP.md            - App registration
├── API_REFERENCE.md          - Graph API reference
├── APPROVALS_API_NOTES.md    - API quirks
└── FEATURE_ANALYSIS.md       - Feature breakdown
```

## Next Steps for Production

1. **Security Hardening**
   - Use Azure Key Vault for secrets
   - Implement API authentication
   - Add rate limiting
   - Enable HTTPS

2. **Deployment**
   - Deploy backend to Azure App Service
   - Deploy frontend to Azure Static Web Apps
   - Update environment variables
   - Configure custom domain

3. **Monitoring**
   - Enable Application Insights
   - Set up cost alerts
   - Configure log analytics

4. **Testing**
   - Add unit tests (Jest)
   - Add integration tests
   - Load testing

5. **Features**
   - Implement resumable upload for large files
   - Add file preview in UI
   - Email notifications for due dates
   - Dashboard/analytics

## Breaking Changes

⚠️ **None** - All changes are additive:
- Existing code still works
- New features are opt-in
- Backend is optional (can run frontend-only)

## Contributors

Setup and development by the Approvals API PoC team.

## Support

For issues:
1. Check documentation in `/docs`
2. Review troubleshooting sections
3. Check backend logs
4. Create GitHub issue

## License

MIT
