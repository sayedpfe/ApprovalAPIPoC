# Microsoft Graph Approvals API Reference

This document provides detailed information about the Microsoft Graph Approvals API endpoints and their usage in this PoC.

## Base URL

```
https://graph.microsoft.com/v1.0/solutions/approval
```

## Authentication

All requests require an OAuth 2.0 access token with appropriate scopes:
- **Application Permission**: `ApprovalItems.ReadWrite.All`
- **Delegated Permission**: `ApprovalItems.ReadWrite.All`

## Endpoints

### 1. List Approval Items

**GET** `/solutions/approval/approvalItems`

Lists all approval items accessible to the authenticated user.

**Response:**
```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#solutions/approval/approvalItems",
  "value": [
    {
      "id": "approval-id",
      "displayName": "Purchase Request",
      "description": "Approval for office supplies",
      "status": "pending",
      "createdDateTime": "2025-12-15T10:00:00Z",
      "owner": {
        "user": {
          "id": "user-id",
          "displayName": "John Doe"
        }
      }
    }
  ]
}
```

### 2. Get Approval Item

**GET** `/solutions/approval/approvalItems/{id}`

Retrieves a specific approval item by ID.

**Parameters:**
- `id` (required): The unique identifier of the approval item

**Response:**
```json
{
  "id": "approval-id",
  "displayName": "Purchase Request",
  "description": "Approval for office supplies",
  "status": "pending",
  "createdDateTime": "2025-12-15T10:00:00Z",
  "completedDateTime": null,
  "owner": {
    "user": {
      "id": "owner-id",
      "displayName": "John Doe"
    }
  },
  "approvers": [
    {
      "user": {
        "id": "approver-id",
        "displayName": "Jane Smith"
      }
    }
  ]
}
```

### 3. Create Approval Item

**POST** `/solutions/approval/approvalItems`

Creates a new approval request.

**Request Body:**
```json
{
  "displayName": "Budget Approval",
  "description": "Approval for Q1 2025 budget",
  "owner": {
    "user": {
      "id": "owner-user-id"
    }
  },
  "approvers": [
    {
      "user": {
        "id": "approver-user-id"
      }
    }
  ]
}
```

**Response:**
```json
{
  "id": "new-approval-id",
  "displayName": "Budget Approval",
  "status": "pending",
  "createdDateTime": "2025-12-15T11:00:00Z"
}
```

### 4. Respond to Approval

**POST** `/solutions/approval/approvalItems/{id}/responses`

Submit a response (approve or reject) to an approval request.

**Parameters:**
- `id` (required): The unique identifier of the approval item

**Request Body:**
```json
{
  "response": "approved",
  "comments": "Approved with conditions"
}
```

Valid response values:
- `approved` - Approve the request
- `rejected` - Reject the request

**Response:**
```json
{
  "id": "response-id",
  "createdDateTime": "2025-12-15T11:30:00Z",
  "response": "approved",
  "comments": "Approved with conditions",
  "createdBy": {
    "user": {
      "id": "approver-id",
      "displayName": "Jane Smith"
    }
  }
}
```

### 5. Get Approval Responses

**GET** `/solutions/approval/approvalItems/{id}/responses`

Retrieves all responses for a specific approval item.

**Parameters:**
- `id` (required): The unique identifier of the approval item

**Response:**
```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#solutions/approval/approvalItems('id')/responses",
  "value": [
    {
      "id": "response-id",
      "response": "approved",
      "comments": "Looks good",
      "createdDateTime": "2025-12-15T11:30:00Z",
      "createdBy": {
        "user": {
          "id": "approver-id",
          "displayName": "Jane Smith"
        }
      }
    }
  ]
}
```

### 6. Cancel Approval

**POST** `/solutions/approval/approvalItems/{id}/cancel`

Cancels a pending approval request.

**Parameters:**
- `id` (required): The unique identifier of the approval item

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "id": "approval-id",
  "status": "cancelled",
  "completedDateTime": "2025-12-15T12:00:00Z"
}
```

## Approval Status Values

- `pending` - Approval is awaiting response
- `approved` - Approval has been approved by all required approvers
- `rejected` - Approval has been rejected
- `cancelled` - Approval has been cancelled by the owner
- `expired` - Approval has expired (if time limit was set)

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": {
    "code": "BadRequest",
    "message": "Invalid request parameters"
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "Unauthorized",
    "message": "Access token is missing or invalid"
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "code": "Forbidden",
    "message": "Insufficient privileges to complete the operation"
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "code": "NotFound",
    "message": "The requested approval item was not found"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "code": "InternalServerError",
    "message": "An error occurred while processing the request"
  }
}
```

## Best Practices

1. **Pagination**: Use `$top` and `$skip` query parameters for large result sets
2. **Filtering**: Use `$filter` to narrow down results (e.g., `$filter=status eq 'pending'`)
3. **Error Handling**: Always implement retry logic with exponential backoff
4. **Token Refresh**: Implement proper token refresh mechanisms
5. **Rate Limiting**: Be aware of Microsoft Graph API throttling limits

## Rate Limits

Microsoft Graph applies throttling when a threshold of requests is exceeded:
- **Per app per tenant**: 2000 requests per second
- **Per user**: 1000 requests per 300 seconds

## Additional Query Parameters

- `$select`: Specify which properties to return
- `$expand`: Include related resources
- `$orderby`: Sort results
- `$top`: Limit the number of results
- `$skip`: Skip a number of results
- `$filter`: Filter results based on criteria

### Example with Query Parameters

```
GET /solutions/approval/approvalItems?$select=id,displayName,status&$filter=status eq 'pending'&$orderby=createdDateTime desc
```

## Webhooks and Notifications

Currently, the Microsoft Graph Approvals API supports change notifications through Microsoft Graph webhooks. You can subscribe to changes in approval items:

```
POST /subscriptions
{
  "changeType": "created,updated",
  "notificationUrl": "https://your-webhook-endpoint.com/notifications",
  "resource": "/solutions/approval/approvalItems",
  "expirationDateTime": "2025-12-16T11:00:00Z"
}
```

## References

- [Official Microsoft Graph Approvals API Documentation](https://learn.microsoft.com/en-us/graph/approvals-app-api)
- [Microsoft Graph REST API v1.0](https://learn.microsoft.com/en-us/graph/api/overview)
- [Microsoft Graph Permissions Reference](https://learn.microsoft.com/en-us/graph/permissions-reference)
