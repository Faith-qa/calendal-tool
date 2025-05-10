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

```bash
cd backend
npm install
npm run start:dev
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

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