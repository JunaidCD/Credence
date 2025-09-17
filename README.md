# 🛡️ Credence - Decentralized Identity & Credential Verification System

**Credence** is a comprehensive blockchain-based platform for issuing, managing, and verifying digital credentials using Ethereum smart contracts and MetaMask integration. Built with modern web technologies, it provides a secure, transparent, and decentralized approach to credential management.

## 🌟 Features

### 🔐 **Core Functionality**
- **Decentralized Identity Management**: Ethereum-based DIDs (Decentralized Identifiers)
- **Smart Contract Integration**: Secure credential storage and verification on blockchain
- **MetaMask Integration**: Seamless wallet connectivity and transaction signing
- **Role-Based Access Control**: Separate interfaces for Users, Issuers, and Verifiers

### 👥 **User Roles**
- **Users (Accounts 2-7)**: Receive, manage, and share credentials
- **Issuers (Accounts 0-1)**: Issue and manage digital credentials
- **Verifiers (Accounts 8-9)**: Verify and approve shared credentials

### 🎯 **Key Features**
- **Real-time Notifications**: Instant updates for credential activities
- **Blockchain Verification**: Cryptographic proof of credential authenticity
- **Credential Sharing**: Secure sharing with verifiers via MetaMask signing
- **Dashboard Analytics**: Comprehensive statistics and activity tracking
- **Responsive Design**: Modern, mobile-friendly interface

## 🏗️ Architecture

### **Frontend Stack**
- **React 18** with Hooks and Context API
- **Vite** for fast development and building
- **TailwindCSS** for modern styling
- **Shadcn/UI** for consistent component library
- **React Query** for efficient data fetching
- **Wouter** for lightweight routing

### **Backend Stack**
- **Node.js** with Express.js
- **Hardhat** for Ethereum development
- **Solidity** smart contracts
- **Web3.js** for blockchain interaction
- **In-memory storage** for development (extensible to databases)

### **Blockchain Layer**
- **Ethereum** compatible networks
- **MetaMask** for wallet management
- **Smart Contracts** for credential registry
- **Event-driven** architecture for real-time updates

## 📋 Prerequisites

Before running Credence locally, ensure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MetaMask** browser extension
- **Git** for version control

## 🚀 Local Development Setup

Follow these steps to run Credence on your local machine:

### 1. **Clone the Repository**
```bash
git clone https://github.com/JunaidCD/Credence.git
cd Credence
```

### 2. **Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start local Hardhat blockchain node (keep this terminal open)
npx hardhat node
```

### 3. **Deploy Smart Contracts**
Open a **new terminal** and run:
```bash
# Make sure you're in the backend directory
cd backend

# Compile smart contracts
npm run compile

# Deploy contracts to local network
npm run deploy:local
```

### 4. **Frontend Setup**
Open a **third terminal** and run:
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. **Access the Application**
Open your browser and navigate to:
```
http://localhost:5000
```

## 🔧 MetaMask Configuration

### **Network Setup**
Add the local Hardhat network to MetaMask:
- **Network Name**: Hardhat Localhost
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Currency Symbol**: `ETH`

### **Import Test Accounts**
Import these private keys into MetaMask for testing:

**Issuer Accounts (0-1):**
```
Account 0: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Account 1: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

**User Accounts (2-7):**
```
Account 2: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Account 3: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
Account 4: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
Account 5: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
Account 6: 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e
Account 7: 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356
```

**Verifier Accounts (8-9):**
```
Account 8: 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97
Account 9: 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6
```

## 🎮 Usage Guide

### **For Users**
1. **Register**: Connect MetaMask and register as a user
2. **Receive Credentials**: Credentials issued by issuers appear automatically
3. **Share Credentials**: Share with verifiers using their DID
4. **Track Status**: Monitor verification status in real-time
5. **Notifications**: Receive updates about credential activities

### **For Issuers**
1. **Register**: Connect MetaMask and register as an issuer
2. **Issue Credentials**: Create and issue credentials to users
3. **Manage Portfolio**: Track issued credentials and their status
4. **Blockchain Integration**: All issuance recorded on blockchain

### **For Verifiers**
1. **Register**: Connect MetaMask and register as a verifier
2. **Review Credentials**: View credentials shared by users
3. **Verify & Approve**: Approve or reject credentials with MetaMask signing
4. **Dashboard Analytics**: Track verification statistics

## 📊 Project Structure

```
Credence/
├── backend/
│   ├── contracts/          # Solidity smart contracts
│   ├── scripts/           # Deployment scripts
│   ├── artifacts/         # Compiled contracts
│   ├── cache/            # Hardhat cache
│   └── package.json
├── frontend/
│   ├── client/           # React frontend
│   │   ├── src/
│   │   │   ├── components/    # Reusable components
│   │   │   ├── pages/        # Main page components
│   │   │   ├── context/      # React contexts
│   │   │   ├── hooks/        # Custom hooks
│   │   │   └── utils/        # Utility functions
│   │   └── public/
│   ├── server/           # Express.js backend
│   │   ├── index.ts      # Server entry point
│   │   ├── routes.ts     # API routes
│   │   └── storage.ts    # Data storage layer
│   └── shared/           # Shared types/schemas
└── README.md
```

## 🔗 Smart Contracts

### **Core Contracts**
- **UserRegistry**: Manages user registration and profiles
- **IssuerRegistry**: Handles issuer registration and permissions
- **CredentialRegistry**: Stores and manages credentials on blockchain

### **Key Functions**
- `registerUser()`: Register new users
- `registerIssuer()`: Register credential issuers
- `issueCredential()`: Issue new credentials
- `verifyCredential()`: Verify credential authenticity

## 🌐 API Endpoints

### **User Management**
- `POST /api/users/register` - Register new user
- `GET /api/users/:address` - Get user by address
- `GET /api/users` - List all users

### **Credential Management**
- `GET /api/credentials/wallet/:address` - Get user credentials
- `POST /api/credentials/share` - Share credential with verifier
- `GET /api/credentials/shared/:verifierAddress` - Get shared credentials
- `PATCH /api/credentials/shared/:id` - Update credential status

### **Notifications**
- `GET /api/notifications/user/:userId` - Get user notifications
- `POST /api/notifications` - Create notification
- `PATCH /api/notifications/:id/read` - Mark as read

## 🛠️ Development Scripts

### **Backend Scripts**
```bash
npm run compile      # Compile smart contracts
npm run deploy:local # Deploy to local network
npm run test         # Run contract tests
npx hardhat node    # Start local blockchain
```

### **Frontend Scripts**
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

## 🔒 Security Features

- **MetaMask Integration**: Secure wallet-based authentication
- **Blockchain Verification**: Immutable credential records
- **Cryptographic Signatures**: Tamper-proof credential sharing
- **Role-Based Access**: Strict permission controls
- **Event Logging**: Comprehensive audit trails

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Responsive Layout**: Works on all device sizes
- **Real-time Updates**: Live data synchronization
- **Interactive Dashboards**: Rich analytics and visualizations
- **Notification System**: Instant activity updates
- **Loading States**: Smooth user experience

## 🚀 Deployment

### **Production Deployment**
1. Configure environment variables
2. Deploy smart contracts to mainnet/testnet
3. Build frontend for production
4. Deploy to hosting platform (Vercel, Netlify, etc.)
5. Configure MetaMask for production network

### **Environment Variables**
```env
REACT_APP_CONTRACT_ADDRESS=your_contract_address
REACT_APP_NETWORK_ID=your_network_id
REACT_APP_RPC_URL=your_rpc_url
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Junaid** - [GitHub Profile](https://github.com/JunaidCD)

## 🙏 Acknowledgments

- **Ethereum Foundation** for blockchain infrastructure
- **MetaMask** for wallet integration
- **Hardhat** for development framework
- **React Team** for the frontend framework
- **Tailwind CSS** for styling framework

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/JunaidCD/Credence/issues) page
2. Create a new issue with detailed description
3. Join our community discussions

---

**🎉 Happy Coding with Credence!** 🛡️

*Building the future of decentralized identity, one credential at a time.*
