# System Architecture Diagrams

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Frontend (Angular)"
        A[Dashboard App] --> B[Task Component]
        A --> C[Auth Service]
        A --> D[Task Service]
        B --> E[Kanban Board]
        B --> F[Task Forms]
        C --> G[JWT Management]
    end
    
    subgraph "Backend (NestJS)"
        H[API Gateway] --> I[Auth Module]
        H --> J[Tasks Module]
        I --> K[JWT Strategy]
        I --> L[RBAC Service]
        J --> M[Tasks Service]
        J --> N[Tasks Controller]
        L --> O[Permission Checks]
        M --> P[Task Repository]
    end
    
    subgraph "Database Layer"
        Q[SQLite Database]
        R[User Table]
        S[Task Table]
        T[Organization Table]
        U[Role Table]
        V[Permission Table]
    end
    
    subgraph "Security Layer"
        W[JWT Tokens]
        X[Guards & Decorators]
        Y[Audit Logging]
    end
    
    A -->|HTTPS/REST| H
    D -->|API Calls| H
    P -->|TypeORM| Q
    Q --> R
    Q --> S
    Q --> T
    Q --> U
    Q --> V
    K --> W
    X --> O
    Y --> Z[Audit Logs]
```

## RBAC Permission Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Gateway
    participant G as JWT Guard
    participant P as Permissions Guard
    participant R as RBAC Service
    participant S as Service Layer
    participant D as Database
    
    U->>F: Login Request
    F->>A: POST /auth/login
    A->>R: Validate Credentials
    R->>D: Query User & Roles
    D-->>R: User Data
    R-->>A: JWT Token + User Info
    A-->>F: Authentication Response
    F-->>U: Login Success
    
    U->>F: Create Task Request
    F->>A: POST /tasks (with JWT)
    A->>G: Validate JWT Token
    G-->>A: User Context
    A->>P: Check Permissions
    P->>R: hasPermission('create_task')
    R->>D: Query User Permissions
    D-->>R: Permission Data
    R-->>P: Permission Result
    P-->>A: Access Granted
    A->>S: Execute Business Logic
    S->>D: Create Task
    D-->>S: Task Created
    S-->>A: Success Response
    A-->>F: Task Created
    F-->>U: Task Created Successfully
```

## Data Model Relationships

```mermaid
erDiagram
    Organization ||--o{ User : contains
    Organization ||--o{ Organization : parent_of
    User ||--o{ Task : creates
    User }o--o{ Role : has
    Role }o--o{ Permission : grants
    
    Organization {
        int id PK
        string name
        string description
        int parentId FK
        datetime createdAt
        datetime updatedAt
    }
    
    User {
        int id PK
        string name
        string email
        string password
        int organizationId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Role {
        int id PK
        string name
        string description
        datetime createdAt
        datetime updatedAt
    }
    
    Permission {
        int id PK
        string name
        string resource
        datetime createdAt
        datetime updatedAt
    }
    
    Task {
        int id PK
        string title
        string description
        string status
        string category
        string priority
        int userId FK
        datetime dueDate
        datetime createdAt
        datetime updatedAt
    }
```

## Task Management Flow

```mermaid
stateDiagram-v2
    [*] --> PENDING: Task Created
    PENDING --> IN_PROGRESS: Start Work
    IN_PROGRESS --> COMPLETED: Mark Complete
    IN_PROGRESS --> CANCELLED: Cancel Task
    PENDING --> CANCELLED: Cancel Task
    COMPLETED --> [*]
    CANCELLED --> [*]
    
    note right of PENDING
        Initial state when task is created
        Can be assigned to users
    end note
    
    note right of IN_PROGRESS
        Task is actively being worked on
        Can be reassigned
    end note
    
    note right of COMPLETED
        Task is finished
        Cannot be modified
    end note
    
    note right of CANCELLED
        Task is cancelled
        Cannot be reactivated
    end note
```

## Security Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Angular App] --> B[JWT Token Storage]
    end
    
    subgraph "API Gateway"
        C[Express Server] --> D[CORS Middleware]
        D --> E[JWT Auth Guard]
        E --> F[Permissions Guard]
        F --> G[Organization Scope Guard]
    end
    
    subgraph "Business Logic"
        H[Controllers] --> I[Services]
        I --> J[RBAC Service]
        J --> K[Permission Matrix]
    end
    
    subgraph "Data Layer"
        L[TypeORM] --> M[SQLite Database]
        M --> N[User Table]
        M --> O[Role Table]
        M --> P[Permission Table]
    end
    
    subgraph "Audit Layer"
        Q[Audit Interceptor] --> R[Audit Service]
        R --> S[Log Files]
    end
    
    A -->|Bearer Token| C
    G --> H
    I --> L
    H --> Q
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        A[Local Development] --> B[NX Serve]
        B --> C[API :3000]
        B --> D[Dashboard :4200]
    end
    
    subgraph "Production Environment"
        E[Load Balancer] --> F[API Server 1]
        E --> G[API Server 2]
        F --> H[PostgreSQL]
        G --> H
        I[CDN] --> J[Static Assets]
        K[Frontend Server] --> I
    end
    
    subgraph "Monitoring"
        L[Log Aggregation] --> M[Audit Logs]
        N[Health Checks] --> O[API Status]
        P[Error Tracking] --> Q[Alert System]
    end
    
    A -.->|Deploy| E
    H --> L
    F --> N
    G --> N
```
