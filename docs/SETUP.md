# Development Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher (comes with Node.js)
- **Git** for version control
- **VS Code** (recommended) or your preferred IDE

### Verify Installation

```bash
node --version    # Should be 18.0.0+
npm --version     # Should be 8.0.0+
git --version     # Any recent version
```

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd TurboVetsProject
```

### 2. Install Dependencies

```bash
npm install
```

This will install all dependencies for both the backend and frontend applications.

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=24h

# Database Configuration
DB_TYPE=sqlite
DB_DATABASE=data/app.db

# Application Configuration
PORT=3000
NODE_ENV=development

# Optional: Logging
LOG_LEVEL=debug
```

### 4. Database Setup

The SQLite database will be created automatically. To seed it with sample data:

```bash
# Seed the database
npx nx run api:seed
```

This will create:
- Sample organizations
- User accounts with different roles
- Sample tasks
- Role and permission data

### 5. Start Development Servers

**Option 1: Start both servers (recommended)**
```bash
npx nx run-many -t serve --projects=api,dashboard --parallel=2
```

**Option 2: Start servers separately**

Terminal 1 (Backend):
```bash
npx nx serve api
```

Terminal 2 (Frontend):
```bash
npx nx serve dashboard
```

### 6. Access the Applications

- **Backend API**: http://localhost:3000
- **Frontend Dashboard**: http://localhost:4200

## Development Workflow

### Available Scripts

```bash
# Development
npx nx serve api                    # Start backend only
npx nx serve dashboard              # Start frontend only
npx nx run-many -t serve --parallel=2  # Start both

# Building
npx nx build api                    # Build backend
npx nx build dashboard              # Build frontend
npx nx run-many -t build            # Build all projects

# Testing
npx nx test api                     # Test backend
npx nx test dashboard               # Test frontend
npx nx run-many -t test             # Test all projects

# Linting
npx nx lint api                     # Lint backend
npx nx lint dashboard               # Lint frontend
npx nx run-many -t lint             # Lint all projects

# Database
npx nx run api:seed                 # Seed database
npx nx run api:reset                # Reset database (if available)

# Utilities
npx nx graph                        # View project dependency graph
npx nx show project api             # Show project details
npx nx affected -t test             # Test only affected projects
```

### Project Structure

```
TurboVetsProject/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/          # Authentication & RBAC
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── rbac.service.ts
│   │   │   │   ├── guards/    # Auth guards
│   │   │   │   ├── decorators/ # Custom decorators
│   │   │   │   └── dto/       # Data transfer objects
│   │   │   ├── tasks/         # Task management
│   │   │   │   ├── tasks.controller.ts
│   │   │   │   ├── tasks.service.ts
│   │   │   │   └── tasks.module.ts
│   │   │   ├── entities/      # TypeORM entities
│   │   │   │   ├── user.entity.ts
│   │   │   │   ├── task.entity.ts
│   │   │   │   ├── organization.entity.ts
│   │   │   │   ├── role.entity.ts
│   │   │   │   └── permission.entity.ts
│   │   │   ├── database/      # Database configuration
│   │   │   └── main.ts        # Application entry point
│   │   └── dist/              # Built application
│   └── dashboard/             # Angular Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── components/ # UI components
│       │   │   │   ├── tasks/  # Task management component
│       │   │   │   └── auth/   # Authentication component
│       │   │   ├── services/   # API services
│       │   │   │   ├── task.service.ts
│       │   │   │   └── auth.service.ts
│       │   │   ├── models/     # TypeScript interfaces
│       │   │   │   └── task.model.ts
│       │   │   ├── guards/     # Route guards
│       │   │   └── app.config.ts
│       │   └── main.ts
│       └── dist/               # Built application
├── packages/                   # Shared libraries
│   ├── @org/strings          # String utilities
│   ├── @org/async            # Async utilities
│   ├── @org/colors           # Color utilities
│   └── @org/utils            # Shared utilities
├── data/
│   └── app.db                # SQLite database
├── docs/                     # Documentation
└── logs/                     # Application logs
```

## Testing

### Backend Testing

The backend uses Jest for testing. Tests are located in `*.spec.ts` files:

```bash
# Run all backend tests
npx nx test api

# Run tests in watch mode
npx nx test api --watch

# Run specific test file
npx nx test api --testPathPattern=tasks.service.spec.ts

# Run tests with coverage
npx nx test api --coverage
```

**Test Structure:**
- Unit tests for services
- Integration tests for controllers
- Mocked dependencies for isolated testing

### Frontend Testing

The frontend uses Jest and Karma for testing:

```bash
# Run all frontend tests
npx nx test dashboard

# Run tests in watch mode
npx nx test dashboard --watch

# Run tests with coverage
npx nx test dashboard --coverage
```

## Database Management

### SQLite Database

The application uses SQLite for development. The database file is located at `data/app.db`.

**Database Operations:**

```bash
# View database schema
sqlite3 data/app.db ".schema"

# View all tables
sqlite3 data/app.db ".tables"

# Query specific table
sqlite3 data/app.db "SELECT * FROM users;"

# Reset database (if reset script exists)
npx nx run api:reset
```

### Database Seeding

The seed script creates sample data for development:

```bash
# Run seed script
npx nx run api:seed
```

**Sample Data Created:**
- 2 organizations (Acme Corp, Tech Solutions)
- 5 users with different roles
- 10 sample tasks
- Role and permission data

## Environment Configuration

### Development Environment

For development, use the following environment variables:

```env
# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Database
DB_TYPE=sqlite
DB_DATABASE=data/app.db

# Application
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
```

### Production Environment

For production, use secure values:

```env
# JWT Configuration
JWT_SECRET=your-super-secure-production-secret-key
JWT_EXPIRES_IN=1h

# Database (PostgreSQL recommended)
DB_TYPE=postgres
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-secure-password
DB_DATABASE=task_management

# Application
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npx nx serve api
```

#### 2. Database Connection Issues

**Error:** `SQLITE_CANTOPEN: unable to open database file`

**Solution:**
```bash
# Ensure data directory exists
mkdir -p data

# Check file permissions
ls -la data/
```

#### 3. JWT Token Issues

**Error:** `jwt malformed` or `invalid token`

**Solution:**
- Clear browser storage
- Check JWT_SECRET in .env file
- Ensure token is properly formatted

#### 4. CORS Issues

**Error:** `Access to fetch at 'http://localhost:3000' from origin 'http://localhost:4200' has been blocked by CORS policy`

**Solution:**
- Check CORS configuration in `apps/api/src/main.ts`
- Ensure frontend is making requests to correct API URL

#### 5. TypeScript Compilation Errors

**Error:** Various TypeScript errors

**Solution:**
```bash
# Clean and rebuild
npx nx reset
npm install
npx nx build api
npx nx build dashboard
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment
LOG_LEVEL=debug npx nx serve api

# Or add to .env file
LOG_LEVEL=debug
```

### Performance Issues

If the application is slow:

1. **Check database queries:**
   ```bash
   # Enable SQL logging in TypeORM
   # Add to database config: logging: true
   ```

2. **Monitor memory usage:**
   ```bash
   # Check Node.js memory usage
   node --inspect-brk dist/apps/api/main.js
   ```

3. **Profile the application:**
   ```bash
   # Use Node.js profiler
   node --prof dist/apps/api/main.js
   ```

## IDE Configuration

### VS Code Setup

Recommended VS Code extensions:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "angular.ng-template",
    "ms-vscode.vscode-json"
  ]
}
```

**Settings for optimal development:**

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

### Debugging

**Backend Debugging:**
1. Set breakpoints in VS Code
2. Start with debug mode: `npx nx serve api --inspect`
3. Attach debugger to port 9229

**Frontend Debugging:**
1. Use browser dev tools
2. Angular DevTools extension
3. Network tab for API calls

## Contributing

### Code Style

- Use Prettier for code formatting
- Follow ESLint rules
- Use TypeScript strict mode
- Write meaningful commit messages

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

### Testing Requirements

- Write tests for new features
- Ensure all tests pass
- Maintain test coverage above 80%
- Update documentation for API changes

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Angular Documentation](https://angular.io/docs)
- [NX Documentation](https://nx.dev/)
- [TypeORM Documentation](https://typeorm.io/)
- [JWT.io](https://jwt.io/) - JWT token debugging
