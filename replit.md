# Decentralized Identity and Verifiable Credentials DApp

## Overview

This is a full-stack decentralized identity (DID) and verifiable credentials management system built as a Web3 DApp. The application enables users to control their digital identity, manage verifiable credentials, and handle verification requests in a decentralized manner. The system supports three user types: regular users who manage their credentials, verifiers who request credential verification, and issuers who create and distribute credentials.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite as the build tool and development server
- **Styling**: Tailwind CSS with a dark-mode Web3 theme featuring purple/blue gradients
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Routing**: Wouter for client-side routing
- **State Management**: React Context API for authentication state, TanStack Query for server state
- **TypeScript Support**: Configured but components are implemented in JavaScript per requirements

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **API Design**: RESTful API with structured route handlers
- **Database Layer**: Drizzle ORM with PostgreSQL dialect
- **Data Storage**: In-memory storage implementation for development with interface for database migration
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)

### Database Schema
- **Users Table**: Stores wallet addresses, DIDs, names, user types (user/verifier/issuer)
- **Credentials Table**: Manages verifiable credentials with issuer/user relationships, types, metadata
- **Verification Requests Table**: Tracks verification requests between verifiers and users with status management

### Authentication and Authorization
- **Web3 Authentication**: MetaMask wallet integration for user authentication
- **DID Generation**: Automatic DID creation using Ethereum address format (`did:ethr:address`)
- **Role-based Access**: User type differentiation for dashboard access and functionality

### Component Architecture
- **Modular Components**: Reusable UI components for credentials, sidebars, modals
- **Dashboard Layouts**: Separate dashboard implementations for each user type
- **Responsive Design**: Mobile-first approach with responsive navigation and layouts

### Data Flow and API Structure
- **Authentication Flow**: `/api/auth/connect` endpoint for wallet connection and user creation/retrieval
- **User Management**: CRUD operations for user profiles and settings
- **Credential Management**: APIs for creating, retrieving, and sharing credentials
- **Verification Workflow**: Request creation, approval/rejection, and status tracking

### UI/UX Design Patterns
- **Glass Morphism**: Semi-transparent backgrounds with blur effects
- **Gradient Accents**: Web3-themed purple/blue color scheme
- **Interactive Elements**: Hover states, animations, and feedback mechanisms
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

## External Dependencies

### Blockchain Integration
- **Neon Database**: PostgreSQL serverless database for production deployment
- **MetaMask**: Ethereum wallet integration for Web3 authentication

### Development and Build Tools
- **Vite**: Frontend build tool with React plugin and development server
- **ESBuild**: Backend bundling for production builds
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer

### UI and Styling Libraries
- **Radix UI**: Headless UI components for accessibility and interaction patterns
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography

### State Management and Data Fetching
- **TanStack Query**: Server state management with caching and background updates
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation for API data

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional CSS class composition
- **class-variance-authority**: Component variant management

### Development Environment
- **Replit Integration**: Development environment with runtime error overlay and cartographer plugin
- **TypeScript**: Type checking and development experience enhancement