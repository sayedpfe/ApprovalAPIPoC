# Approvals API Backend

Backend API for Microsoft Graph Approvals with Azure Cosmos DB and OneDrive integration.

## Features

- ✅ **Cosmos DB Integration** - Store custom approval metadata
- ✅ **OneDrive File Upload** - Upload attachments to creator's OneDrive
- ✅ **Automatic File Sharing** - Share files with approvers
- ✅ **RESTful API** - Clean API endpoints for metadata operations
- ✅ **CORS Enabled** - Secure cross-origin requests from frontend
- ✅ **Error Handling** - Comprehensive error handling and logging

## Architecture

```
Frontend (React)
    ↓
Backend API (Node.js/Express) 
    ↓
├── Cosmos DB (metadata storage)
└── Microsoft Graph API (OneDrive)
```

## Prerequisites

- Node.js 18+ 
- Azure subscription with Cosmos DB account
- Microsoft Graph API access (delegated permissions)

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
copy .env.example .env

# Edit .env with your values
notepad .env
```

### 3. Set Up Cosmos DB

Follow the guide: [COSMOS_DB_SETUP.md](../docs/COSMOS_DB_SETUP.md)

You'll need:
- Cosmos DB endpoint URL
- Primary key
- Database and container will be created automatically

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3001`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `COSMOS_ENDPOINT` | Cosmos DB endpoint | `https://....documents.azure.com:443/` |
| `COSMOS_KEY` | Cosmos DB primary key | `your-key-here` |
| `COSMOS_DATABASE_ID` | Database name | `ApprovalsDB` |
| `COSMOS_CONTAINER_ID` | Container name | `ApprovalMetadata` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## API Endpoints

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-08T10:00:00.000Z"
}
```

### Save Metadata
```http
POST /api/metadata
Content-Type: application/json

{
  "approvalId": "approval-123",
  "metadata": {
    "dueDate": "2026-01-15T10:00:00Z",
    "isSequential": true,
    "approversWithStages": [...]
  }
}
```

### Get Metadata
```http
GET /api/metadata/:approvalId
```

### Get All Metadata
```http
GET /api/metadata?creatorEmail=user@example.com
```

### Update Metadata
```http
PATCH /api/metadata/:approvalId
Content-Type: application/json

{
  "dueDate": "2026-01-20T10:00:00Z"
}
```

### Delete Metadata
```http
DELETE /api/metadata/:approvalId
```

### Upload Attachments
```http
POST /api/metadata/:approvalId/attachments
Content-Type: multipart/form-data

files: [file1, file2, ...]
accessToken: "bearer-token"
approverEmails: ["user1@example.com", "user2@example.com"]
```

## Project Structure

```
backend/
├── server.js                 # Main server file
├── routes/
│   └── metadata.js          # API routes
├── services/
│   ├── cosmosDbService.js   # Cosmos DB operations
│   └── oneDriveService.js   # OneDrive file operations
├── uploads/                 # Temporary file storage
├── package.json
├── .env                     # Environment variables (not in git)
└── .env.example            # Example environment file
```

## Data Models

### Approval Metadata (Cosmos DB)

```json
{
  "id": "approval-123",
  "approvalId": "approval-123",
  "dueDate": "2026-01-15T10:00:00Z",
  "isSequential": true,
  "approversWithStages": [
    {
      "email": "approver1@company.com",
      "stage": 1
    },
    {
      "email": "approver2@company.com",
      "stage": 2
    }
  ],
  "attachments": [
    {
      "id": "file-id-123",
      "name": "document.pdf",
      "size": 1024000,
      "webUrl": "https://...",
      "sharingLink": "https://...",
      "uploadedAt": "2026-01-08T10:00:00Z"
    }
  ],
  "creatorEmail": "creator@company.com",
  "createdAt": "2026-01-08T09:00:00Z",
  "updatedAt": "2026-01-08T10:00:00Z"
}
```

## File Upload Process

1. **Frontend sends files** via multipart/form-data
2. **Multer receives files** → saves to `uploads/` temporarily
3. **Backend uploads to OneDrive** → creator's `/Approvals/{approvalId}/` folder
4. **Backend creates sharing links** and grants permissions to approvers
5. **Backend saves metadata** to Cosmos DB with file info
6. **Backend deletes temporary files**
7. **Response sent** to frontend with file URLs

## Security

### Access Tokens
- Frontend passes user's access token in requests
- Backend uses token to act on behalf of user
- Tokens are NOT stored in database
- Tokens expire after 1 hour (MSAL handles refresh)

### CORS
- Only allows requests from configured `FRONTEND_URL`
- Credentials included in CORS policy

### File Upload Limits
- Max file size: 50MB per file
- Max files per request: 10
- Temporary files cleaned up after upload

### API Security Recommendations

For production:
1. Add authentication middleware
2. Validate access tokens
3. Rate limiting
4. Input sanitization
5. Use Azure Key Vault for secrets

## Error Handling

All errors return JSON format:
```json
{
  "error": "Error message",
  "message": "Detailed message"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (missing parameters)
- `404` - Resource not found
- `500` - Server error

## Logging

Console logging for:
- Server startup/shutdown
- Cosmos DB initialization
- API requests (method + path)
- File uploads/sharing
- Errors with stack traces

## Development

### Run with Auto-Reload
```bash
npm run dev
```

Uses `nodemon` to automatically restart on file changes.

### Debug Mode
```bash
NODE_ENV=development npm start
```

Shows additional debug information and stack traces.

## Testing

### Test Health Endpoint
```bash
curl http://localhost:3001/health
```

### Test Metadata Save
```bash
curl -X POST http://localhost:3001/api/metadata \
  -H "Content-Type: application/json" \
  -d '{
    "approvalId": "test-123",
    "metadata": {"dueDate": "2026-01-15T10:00:00Z"}
  }'
```

### Test File Upload
Use Postman or frontend to test file uploads with proper access token.

## Deployment

### Azure App Service

1. Create App Service (Node.js 18+)
2. Configure environment variables in App Service settings
3. Deploy via:
   - Azure CLI: `az webapp up`
   - VS Code Azure extension
   - GitHub Actions
   - Azure DevOps

### Environment Variables in Azure
Set these in App Service → Configuration → Application settings:
- `COSMOS_ENDPOINT`
- `COSMOS_KEY`
- `COSMOS_DATABASE_ID`
- `COSMOS_CONTAINER_ID`
- `FRONTEND_URL` (production frontend URL)

## Monitoring

### Azure Application Insights (Optional)

1. Add to `.env`:
   ```env
   APPINSIGHTS_INSTRUMENTATIONKEY=your-key
   ```

2. Install SDK:
   ```bash
   npm install applicationinsights
   ```

3. Add to `server.js`:
   ```javascript
   const appInsights = require('applicationinsights');
   appInsights.setup().start();
   ```

## Troubleshooting

### Server won't start
```bash
# Check if port is in use
netstat -ano | findstr :3001

# Change port in .env if needed
PORT=3002
```

### Cosmos DB connection fails
- Verify `COSMOS_ENDPOINT` and `COSMOS_KEY` are correct
- Check firewall settings in Azure Portal
- Ensure Azure subscription is active

### File upload fails
- Check if user has `Files.ReadWrite` permission
- Verify access token is valid
- Check file size (must be < 50MB)
- Ensure `uploads/` directory exists

### CORS errors
- Verify `FRONTEND_URL` matches your frontend URL exactly
- Check browser console for specific CORS error
- Ensure credentials are included in requests

## Performance

### Cosmos DB
- Uses serverless tier (scales automatically)
- Partition key: `/approvalId` (optimal for queries)
- Consistent indexing for fast queries

### File Uploads
- Temporary storage on disk (auto-cleanup)
- Simple upload for files < 4MB
- Consider resumable upload for larger files

### Optimization Tips
1. Enable compression middleware
2. Add Redis cache for frequently accessed metadata
3. Use CDN for static content
4. Implement request batching

## Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Create pull request

## License

MIT

## Support

For issues or questions:
1. Check documentation in `/docs`
2. Review Azure setup guides
3. Check error logs
4. Create GitHub issue

## Related Documentation

- [Cosmos DB Setup Guide](../docs/COSMOS_DB_SETUP.md)
- [OneDrive Integration Guide](../docs/ONEDRIVE_SETUP.md)
- [Frontend README](../frontend/README.md)
