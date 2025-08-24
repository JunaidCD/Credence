# Credence - Decentralized Identity & Verifiable Credentials DApp

Credence is a modern Web3 application that enables users to manage their decentralized digital identity and verifiable credentials on the blockchain. Built with React and featuring MetaMask integration, it provides secure credential issuance, verification, and management.

## Features

- **Decentralized Identity Management**: Create and manage your DID (Decentralized Identifier)
- **Verifiable Credentials**: Issue, receive, and verify digital credentials
- **Multi-Role Support**: User, Verifier, and Issuer dashboards
- **MetaMask Integration**: Secure Web3 authentication
- **Dark Web3 UI**: Modern interface with purple/blue gradients
- **Responsive Design**: Works on desktop and mobile devices

## User Types

### Users
- Manage personal digital identity
- View and organize received credentials
- Respond to verification requests
- Control credential sharing

### Verifiers
- Search for users by DID
- Request credential verification
- Review verification responses
- Manage verification workflows

### Issuers
- Issue new verifiable credentials
- Manage issued credential records
- Set credential metadata and expiry
- Track credential status

## Tech Stack

- **Frontend**: React, Vite, JavaScript (JSX)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Icons**: Lucide React
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: MetaMask Web3 wallet integration
- **State Management**: TanStack Query, React Context

## Prerequisites

Before running the application locally, make sure you have:

- Node.js (v16 or higher)
- npm or yarn package manager
- MetaMask browser extension installed
- PostgreSQL database (optional - uses in-memory storage by default)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd credence
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

The application uses in-memory storage by default, so no database configuration is required for basic functionality.

For production use with PostgreSQL:
- Set up your database connection in the environment variables
- Configure the database URL in the server configuration

### 4. Start the Development Server

```bash
npm run dev
```

This command starts both the backend API server and the frontend development server. The application will be available at:

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/api

### 5. Connect MetaMask

1. Make sure MetaMask is installed in your browser
2. Connect to a test network (like Goerli or Sepolia)
3. Have some test ETH for transaction fees
4. Visit the application and click on any login button
5. Connect your MetaMask wallet when prompted

## Project Structure

```
credence/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components (dashboards)
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility libraries
│   └── index.html
├── server/                 # Backend Express server
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route handlers
│   └── storage.ts         # Data storage interface
├── shared/                # Shared type definitions
│   └── schema.ts          # Database schema
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server (both frontend and backend)
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally

## API Endpoints

### Authentication
- `POST /api/auth/connect` - Connect MetaMask wallet and authenticate

### Users
- `GET /api/users/did/:did` - Get user by DID
- `PUT /api/users/:id` - Update user profile

### Credentials
- `GET /api/credentials/user/:userId` - Get user's credentials
- `GET /api/credentials/issuer/:issuerId` - Get credentials issued by issuer
- `POST /api/credentials` - Issue new credential
- `DELETE /api/credentials/:id` - Delete credential

### Verification Requests
- `GET /api/verification-requests/user/:userId` - Get user's requests
- `GET /api/verification-requests/verifier/:verifierId` - Get verifier's requests
- `POST /api/verification-requests` - Create verification request
- `PUT /api/verification-requests/:id` - Update request status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the application thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please contact: hello@credence.com