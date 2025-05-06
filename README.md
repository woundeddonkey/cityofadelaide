## 1. Project Overview

The City of Adelaide Ship History Web Application documents the histories and stories of families who traveled from England to Australia on the "City of Adelaide" ship during the 1800s. The application allows for the processing of historical documents, management of family records, tracking of voyages, and presentation of these in a maritime heritage-themed interface.

## 2. Architecture

### 2.1 Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Backend**: AWS Amplify
- **Authentication**: AWS Cognito (via Amplify Auth)
- **Database**: AWS AppSync/DynamoDB (via Amplify Data)
- **CI/CD**: AWS Amplify deployment pipeline

### 2.2 Architecture Overview

This project follows a modern serverless architecture pattern with clear separation of concerns:

1. **Presentation Layer**: React components in the `src/` directory
2. **Data Access Layer**: AWS Amplify Data queries/mutations
3. **Authentication Layer**: AWS Cognito with custom post-confirmation workflows
4. **Backend Definition**: Infrastructure-as-Code in the `amplify/` directory

### 2.3 Key Components

- **Amplify Backend**: Defined in `amplify/backend.ts`, configures auth and data resources
- **Data Schema**: Defined in `amplify/data/resource.ts`, contains GraphQL schema and access patterns
- **Authentication**: Configured in `amplify/auth/resource.ts` with post-confirmation triggers
- **Frontend Application**: Built in React with TypeScript using AWS Amplify UI components

## 3. Development Guidelines

### 3.1 Code Structure and Organization

- **Component Structure**: Follow a feature-based organization for components
- **TypeScript**: Use strong typing throughout the application
  - Define interfaces for all data models
  - Avoid using `any` type
- **State Management**: Use React hooks for state management
- **Amplify Schema**: Keep data models in the schema definition file

### 3.2 Coding Standards

- **Clean Code Principles**:
  - Functions should do one thing and do it well
  - Keep functions and components small and focused
  - Use meaningful variable and function names
  - Avoid deep nesting of conditionals and loops
- **TypeScript Standards**:
  - Use proper TypeScript interfaces for all data structures
  - Leverage TypeScript's type system to prevent runtime errors
- **React Best Practices**:
  - Use functional components with hooks
  - Avoid prop drilling by using context when appropriate
  - Implement proper error boundaries
  - Create reusable components where possible

### 3.3 Testing Strategy

- **Unit Tests**: Write tests for utility functions and individual components
- **Integration Tests**: Test interaction between components
- **End-to-End Tests**: Test complete user flows
- **Test Coverage**: Aim for at least 80% test coverage for critical paths

### 3.4 Git Workflow

- Use feature branches for development
- Require pull requests for merging to main branch
- Follow conventional commit message format
- Keep commits small and focused

### 3.5 AWS Amplify Best Practices

- **Local Development**: Use `amplify sandbox` for local development
- **Authentication**: Follow least privilege principle for authorization rules
- **GraphQL Schema**: Design carefully to avoid performance issues
- **Infrastructure Changes**: Test infrastructure changes in sandbox environment first

## 4. Getting Started

### 4.1 Prerequisites

- Node.js (v18+)
- npm or yarn
- AWS Account with appropriate permissions
- Amplify CLI

### 4.2 Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. For backend changes, use Amplify CLI

### 4.3 Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build production version
- `npm run lint`: Run ESLint
- `npm run typecheck`: Run TypeScript type checking

