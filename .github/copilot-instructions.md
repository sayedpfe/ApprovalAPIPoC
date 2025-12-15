# Microsoft Graph Approvals API PoC

This workspace contains a Proof of Concept for integrating Microsoft Graph Approvals API with a custom web application.

## Project Structure
- **backend/**: Node.js/Express server handling Microsoft Graph API calls
- **frontend/**: React application with MSAL authentication
- **docs/**: Additional documentation and API references

## Development Guidelines
- Use Microsoft Authentication Library (MSAL) for authentication
- Follow Microsoft Graph API best practices
- Use environment variables for sensitive configuration
- Test with delegated permissions for Approvals API

## Key Features
- User authentication via Microsoft Entra ID
- Create approval requests
- View and manage approval statuses
- List user's pending approvals
