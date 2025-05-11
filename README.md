# Full Stack TypeScript Project

This project consists of a NestJS backend and React frontend, both written in TypeScript with comprehensive testing setup.

## Project Structure

```
.
├── backend/           # NestJS application
├── frontend/         # React application
└── .github/          # GitHub Actions workflows
```

## Setup Instructions

### Backend (NestJS)

1. Copy the environment variables template:
```bash
cd backend
cp .env.example .env
```

2. Update the `.env` file with your configuration:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Generate a secure random string using:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Get these from [Google Cloud Console](https://console.cloud.google.com)
     - Create a new project or select an existing one
     - Enable the Google+ API
     - Go to Credentials
     - Create OAuth 2.0 Client ID
     - Add authorized redirect URI: `http://localhost:3000/auth/google/callback`

3. Install dependencies and start the server:
```bash
npm install
npm run start:dev
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

## Security Considerations

- Never commit the `.env` file to version control
- Keep your JWT secret secure and unique for each environment
- Rotate secrets and credentials regularly
- Use environment-specific configuration for production
- Consider using a secrets management service in production

## Testing

### Backend Tests
```bash
cd backend
npm run test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## Development Workflow

This project follows Gitflow workflow:
- `main` - Production branch
- `develop` - Development branch
- `feature/*` - Feature branches

## CI/CD

GitHub Actions workflow runs on push/PR to develop branch:
- Jest tests
- ESLint checks 