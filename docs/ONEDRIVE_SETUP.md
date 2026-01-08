# OneDrive Integration Setup Guide

This guide explains how OneDrive integration works for file attachments in the Approvals API PoC.

## How It Works

1. **User creates approval** with file attachments
2. **Files are uploaded** to creator's OneDrive in `/Approvals/{approvalId}/` folder
3. **Files are automatically shared** with all approvers via Microsoft Graph API
4. **Approvers receive email notifications** with links to view files
5. **File metadata and links** are stored in Cosmos DB

## Architecture

```
User Browser → Frontend → Backend API → Microsoft Graph API → OneDrive
                                     ↓
                              Cosmos DB (metadata storage)
```

## Required Microsoft Graph Permissions

The frontend app needs these **delegated permissions** (already configured in MSAL):

### Existing Permissions
- ✅ `User.Read` - Read user profile
- ✅ `User.Read.All` - Search for users (people picker)
- ✅ `ApprovalSolution.ReadWrite` - Create/manage approvals
- ✅ `ApprovalSolutionResponse.ReadWrite` - Respond to approvals

### New Permissions Needed for OneDrive
Add these to your Azure App Registration:

1. **Files.ReadWrite** - Upload files to user's OneDrive
2. **Files.ReadWrite.All** - Share files with other users (optional, more permissions)
3. **Sites.ReadWrite.All** - Alternative for file sharing

**Recommended**: Use `Files.ReadWrite` for basic functionality

## Step 1: Update Azure App Registration

### Using Azure Portal

1. **Navigate to Azure Portal** → Azure Active Directory → App registrations

2. **Select your app** (the one you created for MSAL)

3. **API permissions** → Add a permission

4. **Microsoft Graph** → Delegated permissions

5. **Add these permissions:**
   - `Files.ReadWrite` - Upload and manage user's files
   - `Files.ReadWrite.All` - Share files with others (if using file sharing)

6. **Grant admin consent** (if required by your organization)
   - Click "Grant admin consent for [Your Organization]"

## Step 2: Update Frontend Auth Config

Update `frontend/src/authConfig.js`:

```javascript
export const loginRequest = {
  scopes: [
    'User.Read',
    'User.Read.All',
    'ApprovalSolution.ReadWrite',
    'ApprovalSolutionResponse.ReadWrite',
    'Files.ReadWrite',        // NEW: For file uploads
    'Files.ReadWrite.All'     // NEW: For sharing files (optional)
  ]
};
```

## Step 3: How File Upload Works

### Frontend Flow

1. **User selects files** in CreateApproval form
2. **Form submission**:
   ```javascript
   // Get access token with Files.ReadWrite scope
   const tokenResponse = await instance.acquireTokenSilent({
     scopes: ['Files.ReadWrite', 'Files.ReadWrite.All'],
     account: accounts[0]
   });
   
   // Upload files via backend
   const result = await metadataService.uploadAttachments(
     approvalId,
     files,           // File objects from input
     approverEmails,  // Array of approver emails
     tokenResponse.accessToken
   );
   ```

### Backend Flow

1. **Receives files** via multipart/form-data
2. **Uploads to OneDrive**:
   - Path: `/Approvals/{approvalId}/filename.ext`
   - Uses Microsoft Graph: `PUT /me/drive/root:/Approvals/{approvalId}/filename.ext:/content`

3. **Creates sharing link**:
   - Organization-wide view link
   - Uses: `POST /me/drive/items/{fileId}/createLink`

4. **Grants specific permissions**:
   - Sends invitation to each approver
   - Uses: `POST /me/drive/items/{fileId}/invite`
   - Recipients get email with file access

5. **Saves metadata** to Cosmos DB:
   ```json
   {
     "approvalId": "...",
     "attachments": [
       {
         "id": "file-id",
         "name": "document.pdf",
         "size": 1024000,
         "webUrl": "https://...",
         "sharingLink": "https://...",
         "uploadedAt": "2026-01-08T..."
       }
     ]
   }
   ```

## File Sharing Options

### Option 1: Organization Sharing Link (Current Implementation)
```javascript
// Create a link that anyone in the organization can view
POST /me/drive/items/{fileId}/createLink
{
  "type": "view",
  "scope": "organization"
}
```

**Pros:**
- Simple to implement
- One link works for everyone
- No individual permission management

**Cons:**
- Anyone in the organization with the link can view
- Less granular control

### Option 2: Individual Permissions (More Secure)
```javascript
// Grant read permission to specific user
POST /me/drive/items/{fileId}/invite
{
  "recipients": [{ "email": "approver@company.com" }],
  "requireSignIn": true,
  "sendInvitation": true,
  "roles": ["read"]
}
```

**Pros:**
- Exact control over who can access
- Email notification sent automatically
- Can revoke individual access

**Cons:**
- More API calls (one per approver)
- Slightly more complex

**Recommendation**: Use Option 2 for production (already implemented)

## File Size Limits

### Frontend (Multer)
```javascript
limits: { fileSize: 50 * 1024 * 1024 } // 50MB
```

### Microsoft Graph API
- **Simple upload**: Up to 4MB
- **Resumable upload**: Up to 250GB (for larger files)

Current implementation uses simple upload (4MB limit per file).

### To Support Larger Files

Implement resumable upload session:
```javascript
// 1. Create upload session
POST /me/drive/root:/path/to/file.zip:/createUploadSession

// 2. Upload in chunks
PUT {uploadUrl}
Content-Range: bytes 0-999999/5000000

// 3. Continue until complete
```

See: [Large file upload guide](https://learn.microsoft.com/en-us/graph/api/driveitem-createuploadsession)

## Security Considerations

### Access Token Handling

**❌ Don't do this:**
```javascript
// Storing full access token in database - NEVER DO THIS
await saveMetadata(approvalId, {
  accessToken: token  // ❌ Security risk!
});
```

**✅ Do this instead:**
```javascript
// Pass token directly to backend in request
// Backend uses it immediately, doesn't store
const result = await uploadAttachments(approvalId, files, emails, token);
```

### File Access Control

1. **User consent**: Users must consent to file access
2. **Delegated permissions**: Backend acts on behalf of the user
3. **Token expiration**: Access tokens expire after 1 hour
4. **Token refresh**: MSAL handles automatic refresh

### Folder Organization

```
OneDrive Root
└── Approvals/
    ├── approval-123/
    │   ├── document.pdf
    │   └── image.png
    └── approval-456/
        └── spreadsheet.xlsx
```

Benefits:
- ✅ Organized by approval
- ✅ Easy to find files
- ✅ Can delete entire folder when approval is closed
- ✅ Clear ownership (in creator's OneDrive)

## Testing File Upload

### Manual Test
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Create an approval with file attachment
4. Check creator's OneDrive for `/Approvals/` folder
5. Verify approvers receive sharing invitation emails

### Using Postman/curl

```bash
# Upload file
curl -X POST http://localhost:3001/api/metadata/test-approval/attachments \
  -F "files=@/path/to/file.pdf" \
  -F "accessToken=YOUR_ACCESS_TOKEN" \
  -F "approverEmails=[\"approver1@company.com\", \"approver2@company.com\"]"
```

## Troubleshooting

### Error: "Access token is required"
- Ensure token is passed in request body
- Verify token hasn't expired

### Error: "Failed to upload file to OneDrive"
- Check if Files.ReadWrite permission is granted
- Verify user has OneDrive enabled
- Check file size (must be < 4MB for simple upload)

### Error: "Failed to share file"
- Ensure Files.ReadWrite.All permission is granted
- Verify approver emails are valid
- Check if approvers are in the same organization

### Files upload but approvers can't access
- Verify sharing permissions were granted
- Check approver email addresses
- Ensure approvers are signed in to Microsoft account

### "Insufficient privileges" error
- Grant admin consent for permissions
- Ensure user consented to file access
- Verify app registration has correct API permissions

## Alternative: SharePoint Integration

If you prefer SharePoint over OneDrive:

1. Use SharePoint site instead of OneDrive
2. Create dedicated document library
3. Same Graph API endpoints work with SharePoint
4. Better for enterprise scenarios

```javascript
// Upload to SharePoint
PUT /sites/{site-id}/drive/root:/Approvals/{approvalId}/file.pdf:/content
```

## Next Steps

1. ✅ Configure Azure App Registration permissions
2. ✅ Update frontend authConfig.js
3. ✅ Test file upload flow
4. ➡️ Verify approvers can access files
5. ➡️ Test file deletion when approval is completed

## References

- [OneDrive API Documentation](https://learn.microsoft.com/en-us/graph/api/resources/onedrive)
- [Upload Files to OneDrive](https://learn.microsoft.com/en-us/graph/api/driveitem-put-content)
- [Share Files](https://learn.microsoft.com/en-us/graph/api/driveitem-invite)
- [File Upload Best Practices](https://learn.microsoft.com/en-us/graph/onedrive-concept-overview)
