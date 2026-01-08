# Azure Cosmos DB Setup Guide

This guide will walk you through setting up Azure Cosmos DB for the Approvals API PoC.

## Prerequisites
- Active Azure subscription
- Azure CLI installed (optional, but recommended)
- Access to Azure Portal

## Step 1: Create Cosmos DB Account

### Option A: Using Azure Portal

1. **Sign in to Azure Portal**
   - Go to https://portal.azure.com
   - Sign in with your Azure account

2. **Create a new Cosmos DB account**
   - Click "Create a resource"
   - Search for "Azure Cosmos DB"
   - Click "Create"

3. **Configure the account**
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or select existing (e.g., `rg-approvals-poc`)
   - **Account Name**: Enter a unique name (e.g., `approvals-cosmos-db`)
   - **API**: Select "Core (SQL)" (recommended for JSON documents)
   - **Location**: Choose a region close to you
   - **Capacity mode**: Select "Serverless" for PoC (cost-effective, no throughput provisioning needed)
   - **Apply Free Tier Discount**: Yes (if available - provides 1000 RU/s free)

4. **Review and Create**
   - Click "Review + create"
   - Click "Create"
   - Wait for deployment (usually 5-10 minutes)

### Option B: Using Azure CLI

```bash
# Login to Azure
az login

# Set variables
RESOURCE_GROUP="rg-approvals-poc"
LOCATION="eastus"
ACCOUNT_NAME="approvals-cosmos-db"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Cosmos DB account (Serverless)
az cosmosdb create \
  --name $ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP \
  --locations regionName=$LOCATION \
  --capabilities EnableServerless \
  --default-consistency-level Session
```

## Step 2: Get Connection Details

1. **Navigate to your Cosmos DB account** in Azure Portal

2. **Get the Endpoint URI**
   - Go to "Keys" section in the left menu
   - Copy the "URI" (e.g., `https://approvals-cosmos-db.documents.azure.com:443/`)

3. **Get the Primary Key**
   - In the same "Keys" section
   - Copy the "PRIMARY KEY" (long string of characters)

4. **Keep these values secure** - you'll need them for the `.env` file

## Step 3: Configure the Backend

1. **Navigate to the backend folder**
   ```bash
   cd backend
   ```

2. **Create `.env` file**
   - Copy `.env.example` to `.env`
   ```bash
   copy .env.example .env
   ```

3. **Update the `.env` file** with your Cosmos DB details:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Azure Cosmos DB Configuration
   COSMOS_ENDPOINT=https://your-account-name.documents.azure.com:443/
   COSMOS_KEY=your-primary-key-here
   COSMOS_DATABASE_ID=ApprovalsDB
   COSMOS_CONTAINER_ID=ApprovalMetadata

   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   ```

   Replace:
   - `your-account-name` with your Cosmos DB account name
   - `your-primary-key-here` with the PRIMARY KEY from Azure Portal

## Step 4: Database and Container Creation

The backend will **automatically create** the database and container on first run:
- **Database Name**: `ApprovalsDB`
- **Container Name**: `ApprovalMetadata`
- **Partition Key**: `/approvalId`

No manual creation needed!

## Step 5: Install Backend Dependencies

```bash
cd backend
npm install
```

## Step 6: Start the Backend Server

```bash
npm start
```

You should see:
```
Initializing Cosmos DB client...
Database ready: ApprovalsDB
Container ready: ApprovalMetadata
✅ Server running on http://localhost:3001
✅ Cosmos DB initialized successfully
```

## Step 7: Update Frontend Configuration

1. **Create/update** `frontend/.env` file:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:3001
   ```

2. **Restart the frontend** if it's already running

## Cost Estimation

### Serverless Tier (Recommended for PoC)
- **First 1 million RU/s**: FREE (if free tier discount applied)
- **After free tier**: ~$0.25 per million RU/s
- **Storage**: First 25 GB free, then ~$0.25/GB/month

### Typical PoC Usage
- **Estimated cost**: $0-5 per month for testing
- **Recommendation**: Enable Cost Alerts in Azure Portal

## Monitoring and Management

### View Data in Azure Portal
1. Go to your Cosmos DB account
2. Click "Data Explorer"
3. Expand `ApprovalsDB` → `ApprovalMetadata`
4. View/query your documents

### Query Examples
```sql
-- Get all metadata
SELECT * FROM c

-- Get metadata for specific approval
SELECT * FROM c WHERE c.approvalId = "approval-id-here"

-- Get metadata by creator
SELECT * FROM c WHERE c.creatorEmail = "user@example.com"
```

## Security Best Practices

1. **Never commit `.env` file** to Git
   - Already added to `.gitignore`

2. **Use different keys** for dev/staging/production

3. **Enable firewall rules** in Cosmos DB:
   - Go to "Firewall and virtual networks"
   - Add your IP addresses
   - Or use Azure Virtual Network

4. **Rotate keys regularly**
   - Use Azure Key Vault for production

5. **Monitor costs**
   - Set up cost alerts in Azure Portal
   - Review usage monthly

## Troubleshooting

### Error: "Cosmos DB endpoint and key must be configured"
- Check that `.env` file exists in backend folder
- Verify COSMOS_ENDPOINT and COSMOS_KEY are set correctly

### Error: "Failed to initialize Cosmos DB"
- Verify your PRIMARY KEY is correct (not SECONDARY KEY)
- Check that your Azure subscription is active
- Ensure your IP is not blocked by firewall

### Backend won't start
```bash
# Check if port 3001 is already in use
netstat -ano | findstr :3001

# If in use, kill the process or change PORT in .env
```

### Connection timeout
- Check firewall settings in Cosmos DB
- Verify your network allows outbound HTTPS (443)

## Next Steps

1. ✅ Cosmos DB is set up
2. ✅ Backend is connected
3. ➡️ Test the API endpoints
4. ➡️ Update frontend to use backend API
5. ➡️ Set up OneDrive permissions (next guide)

## Additional Resources

- [Cosmos DB Documentation](https://learn.microsoft.com/en-us/azure/cosmos-db/)
- [Cosmos DB Pricing](https://azure.microsoft.com/en-us/pricing/details/cosmos-db/)
- [Cosmos DB Free Tier](https://learn.microsoft.com/en-us/azure/cosmos-db/free-tier)
- [Query Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/sql/sql-query-getting-started)
