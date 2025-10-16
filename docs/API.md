# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All API endpoints (except login) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "data": <response-data>,
  "message": "Success",
  "statusCode": 200
}
```

### Error Response
```json
{
  "message": "Error description",
  "statusCode": 400,
  "error": "Bad Request"
}
```

## Authentication Endpoints

### POST /auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "organization": {
      "id": 1,
      "name": "Acme Corp"
    },
    "roles": [
      {
        "id": 1,
        "name": "Admin",
        "permissions": [
          {
            "id": 1,
            "name": "create_task",
            "resource": "tasks"
          }
        ]
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid credentials
- `401 Unauthorized` - Authentication failed

## Task Management Endpoints

### GET /tasks

Retrieve tasks based on user's permissions and organization scope.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `status` | string | Filter by task status | `pending`, `in_progress`, `completed`, `cancelled` |
| `assigneeId` | number | Filter by assignee ID | `123` |
| `organizationId` | number | Filter by organization ID | `456` |
| `priority` | string | Filter by priority | `low`, `medium`, `high`, `urgent` |
| `page` | number | Page number for pagination | `1` |
| `limit` | number | Items per page | `10` |

**Example Request:**
```
GET /tasks?status=pending&assigneeId=123&priority=high
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive README and API docs",
    "status": "pending",
    "priority": "high",
    "category": "work",
    "assigneeId": 123,
    "assignee": {
      "id": 123,
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "creator": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "dueDate": "2024-12-31T23:59:59.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
]
```

### POST /tasks

Create a new task.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description (optional)",
  "priority": "medium",
  "category": "work",
  "assigneeId": 123,
  "dueDate": "2024-12-31T23:59:59.000Z"
}
```

**Required Fields:**
- `title` (string) - Task title

**Optional Fields:**
- `description` (string) - Task description
- `priority` (string) - Task priority (`low`, `medium`, `high`, `urgent`)
- `category` (string) - Task category
- `assigneeId` (number) - ID of user to assign task to
- `dueDate` (string) - Due date in ISO format

**Response:**
```json
{
  "id": 3,
  "title": "New Task",
  "description": "Task description",
  "status": "pending",
  "priority": "medium",
  "category": "work",
  "assigneeId": 123,
  "assignee": {
    "id": 123,
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "creator": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "dueDate": "2024-12-31T23:59:59.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions

### GET /tasks/:id

Get a specific task by ID.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Path Parameters:**
- `id` (number) - Task ID

**Response:**
```json
{
  "id": 1,
  "title": "Complete project documentation",
  "description": "Write comprehensive README and API docs",
  "status": "pending",
  "priority": "high",
  "category": "work",
  "assigneeId": 123,
  "assignee": {
    "id": 123,
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "creator": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "dueDate": "2024-12-31T23:59:59.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Task not found
- `403 Forbidden` - Access denied

### PUT /tasks/:id

Update an existing task.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Path Parameters:**
- `id` (number) - Task ID

**Request Body:**
```json
{
  "title": "Updated Task Title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "urgent",
  "assigneeId": 456,
  "dueDate": "2024-12-25T23:59:59.000Z"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Updated Task Title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "urgent",
  "category": "work",
  "assigneeId": 456,
  "assignee": {
    "id": 456,
    "name": "Bob Johnson",
    "email": "bob@example.com"
  },
  "creator": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "dueDate": "2024-12-25T23:59:59.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T15:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Task not found
- `403 Forbidden` - Insufficient permissions

### DELETE /tasks/:id

Delete a task.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Path Parameters:**
- `id` (number) - Task ID

**Response:**
```
HTTP 204 No Content
```

**Error Responses:**
- `404 Not Found` - Task not found
- `403 Forbidden` - Insufficient permissions

### GET /tasks/assignable-users

Get list of users that can be assigned tasks within the current user's organization.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "organization": {
      "id": 1,
      "name": "Acme Corp"
    }
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "organization": {
      "id": 1,
      "name": "Acme Corp"
    }
  }
]
```

## Admin Endpoints

### GET /tasks/admin/stats

Get organization statistics (Admin/Owner only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "totalTasks": 150,
  "ownOrgTasks": 100,
  "subOrgTasks": 50,
  "tasksByStatus": {
    "pending": 30,
    "in_progress": 45,
    "completed": 60,
    "cancelled": 15
  },
  "tasksByPriority": {
    "low": 40,
    "medium": 60,
    "high": 35,
    "urgent": 15
  },
  "hierarchy": {
    "id": 1,
    "name": "Acme Corp",
    "children": [
      {
        "id": 2,
        "name": "Engineering Team",
        "children": []
      },
      {
        "id": 3,
        "name": "Marketing Team",
        "children": []
      }
    ]
  }
}
```

**Error Responses:**
- `403 Forbidden` - Admin/Owner role required

### GET /audit-logs

Retrieve audit logs (Admin/Owner only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `userId` | number | Filter by user ID | `123` |
| `action` | string | Filter by action | `create_task`, `update_task` |
| `resource` | string | Filter by resource | `tasks`, `users` |
| `startDate` | string | Start date filter | `2024-01-01` |
| `endDate` | string | End date filter | `2024-12-31` |
| `page` | number | Page number | `1` |
| `limit` | number | Items per page | `50` |

**Response:**
```json
[
  {
    "id": 1,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "userId": 1,
    "userName": "John Doe",
    "action": "create_task",
    "resource": "tasks",
    "resourceId": 123,
    "status": "success",
    "details": {
      "taskTitle": "New Task",
      "assigneeId": 456
    },
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  }
]
```

## Error Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| `400` | Bad Request | Invalid request data, missing required fields |
| `401` | Unauthorized | Missing or invalid JWT token |
| `403` | Forbidden | Insufficient permissions for the action |
| `404` | Not Found | Resource not found |
| `500` | Internal Server Error | Server-side error |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **Task endpoints**: 100 requests per minute per user
- **Admin endpoints**: 50 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks (Future Feature)

Webhooks will be available for real-time notifications:

### Task Created Webhook
```json
{
  "event": "task.created",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {
    "task": {
      "id": 123,
      "title": "New Task",
      "status": "pending",
      "assigneeId": 456
    }
  }
}
```

### Task Updated Webhook
```json
{
  "event": "task.updated",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {
    "task": {
      "id": 123,
      "title": "Updated Task",
      "status": "in_progress",
      "changes": {
        "status": {
          "from": "pending",
          "to": "in_progress"
        }
      }
    }
  }
}
```
