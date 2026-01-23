# Azure Deployment Guide

This guide will walk you through deploying the backend API to Azure App Service with Managed Identity authentication.

## Prerequisites
- Azure CLI installed and logged in (`az login`)
- Azure subscription with permissions to create resources
- Cosmos DB account already created (from COSMOS_DB_SETUP.md)

## Deployment Steps

### Step 1: Create Azure App Service

```bash
# Set variables
RESOURCE_GROUP="rg-approvals-poc"
LOCATION="westus2"
APP_SERVICE_PLAN="plan-approvals-backend"
APP_SERVICE_NAME="approvals-backend-api"  # Must be globally unique
COSMOS_ACCOUNT="approvals-cosmos-db"

# Create App Service Plan (Linux, Free tier for testing)
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku F1

# Create Web App
az webapp create \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:18-lts"
```

### Step 2: Enable Managed Identity

```bash
# Enable system-assigned managed identity
az webapp identity assign \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP

# Get the principal ID (you'll need this for role assignment)
PRINCIPAL_ID=$(az webapp identity show \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId -o tsv)

echo "Managed Identity Principal ID: $PRINCIPAL_ID"
```

### Step 3: Assign Cosmos DB Permissions

```bash
# Get Cosmos DB resource ID
COSMOS_ID=$(az cosmosdb show \
  --name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query id -o tsv)

# Assign "Cosmos DB Built-in Data Contributor" role
az cosmosdb sql role assignment create \
  --account-name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --role-definition-name "Cosmos DB Built-in Data Contributor" \
  --principal-id $PRINCIPAL_ID \
  --scope $COSMOS_ID
```

### Step 4: Configure App Settings

```bash
# Get Cosmos DB endpoint
COSMOS_ENDPOINT=$(az cosmosdb show \
  --name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query documentEndpoint -o tsv)

# Configure app settings
az webapp config appsettings set \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    COSMOS_ENDPOINT="$COSMOS_ENDPOINT" \
    COSMOS_DATABASE_ID=ApprovalsDB \
    COSMOS_CONTAINER_ID=ApprovalMetadata \
    USE_AZURE_AD_AUTH=true \
    FRONTEND_URL="https://your-frontend-url.azurestaticapps.net" \
    PORT=8080
```

### Step 5: Deploy the Code

#### Option A: Using Azure CLI (Recommended)

```bash
# Navigate to backend folder
cd backend

# Create a ZIP file for deployment
Compress-Archive -Path * -DestinationPath ../backend.zip -Force

# Deploy to Azure
cd ..
az webapp deployment source config-zip \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --src backend.zip

# Clean up
Remove-Item backend.zip
```

#### Option B: Using GitHub Actions (CI/CD)

See `GITHUB_ACTIONS_SETUP.md` for automated deployment setup.

#### Option C: Using VS Code Azure Extension

1. Install Azure App Service extension
2. Right-click on `backend` folder
3. Select "Deploy to Web App..."
4. Choose your App Service

### Step 6: Configure CORS

```bash
# Allow frontend to call backend API
az webapp cors add \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --allowed-origins "http://localhost:3000" "https://your-frontend-url.azurestaticapps.net"
```

### Step 7: Verify Deployment

```bash
# Get the app URL
APP_URL=$(az webapp show \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostName -o tsv)

echo "Backend URL: https://$APP_URL"

# Test health endpoint
curl "https://$APP_URL/health"
```

Expected response:
```json
{
  "status": "ok",
  "message": "Backend API is running"
}
```

## Update Frontend Configuration

After deployment, update your frontend `.env` file:

```env
REACT_APP_BACKEND_URL=https://your-app-name.azurewebsites.net
```

## Monitoring and Logs

### View Application Logs

```bash
# Enable logging
az webapp log config \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --web-server-logging filesystem

# Stream logs
az webapp log tail \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP
```

### View in Azure Portal

1. Navigate to your App Service
2. Go to "Monitoring" → "Log stream"
3. Or use "Diagnose and solve problems" for troubleshooting

## Local Development with Azure AD

To test Azure AD authentication locally:

```bash
# Login to Azure CLI
az login

# Set environment variable
export USE_AZURE_AD_AUTH=true
# Or in .env file: USE_AZURE_AD_AUTH=true

# Run backend
npm start
```

DefaultAzureCredential will automatically use your Azure CLI credentials.

## Troubleshooting

### Error: "403 Forbidden" from Cosmos DB

**Solution**: Ensure Managed Identity has the correct role assignment
```bash
# Verify role assignment
az cosmosdb sql role assignment list \
  --account-name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP
```

### Error: "Application didn't start"

**Solution**: Check application logs
```bash
az webapp log tail --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP
```

Common issues:
- Missing environment variables
- Wrong Node.js version
- Package installation failures

### Error: "Cannot find module"

**Solution**: Ensure package.json is deployed correctly
```bash
# Restart the app
az webapp restart --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP
```

## Cost Optimization

### Free Tier (F1)
- **Pros**: Free, good for testing
- **Cons**: Limited compute, 60 min/day limit, no always-on
- **Recommendation**: Development/PoC only

### Basic Tier (B1)
- **Cost**: ~$13/month
- **Features**: Always-on, custom domains, SSL
- **Recommendation**: Production applications

### To upgrade:
```bash
az appservice plan update \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1
```

## Security Best Practices

1. **Enable HTTPS Only**
   ```bash
   az webapp update \
     --name $APP_SERVICE_NAME \
     --resource-group $RESOURCE_GROUP \
     --https-only true
   ```

2. **Set minimum TLS version**
   ```bash
   az webapp config set \
     --name $APP_SERVICE_NAME \
     --resource-group $RESOURCE_GROUP \
     --min-tls-version 1.2
   ```

3. **Enable Application Insights** (optional)
   ```bash
   az monitor app-insights component create \
     --app approvals-backend-insights \
     --location $LOCATION \
     --resource-group $RESOURCE_GROUP
   ```

4. **Use Azure Key Vault** for sensitive configuration (production)

## Cleanup

To delete all resources:

```bash
# Delete just the App Service
az webapp delete --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP

# Delete App Service Plan
az appservice plan delete --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP

# Delete entire resource group (CAUTION: deletes everything)
# az group delete --name $RESOURCE_GROUP --yes
```

## Next Steps

1. ✅ Backend deployed to Azure
2. ✅ Managed Identity configured
3. ➡️ Deploy frontend to Azure Static Web Apps
4. ➡️ Set up CI/CD pipeline
5. ➡️ Configure custom domain (optional)

## Additional Resources

- [Azure App Service Documentation](https://learn.microsoft.com/en-us/azure/app-service/)
- [Managed Identity Documentation](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/)
- [DefaultAzureCredential](https://learn.microsoft.com/en-us/dotnet/azure/sdk/authentication/)
