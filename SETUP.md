# 🚀 Credence Setup Guide

## ✅ Issues Fixed

1. **Port Conflicts**: Backend now runs on port 5001, frontend on 5174
2. **Web3 Connection**: Auto-switches to Hardhat network
3. **Favicon Error**: Added proper favicon
4. **Contract Deployment**: Contracts deployed and ready

## 📋 Quick Setup Steps

### 1. **Start Hardhat Node** (if not running)
```bash
cd backend
npm run node
```

### 2. **Deploy Contracts** (already done)
```bash
cd backend
npm run deploy:local
```

### 3. **Start Servers**
```bash
cd frontend
npm run dev          # Backend on port 5001
npx vite --port 5174 # Frontend on port 5174
```

## 🔗 MetaMask Configuration

The app will **automatically** configure MetaMask for you! When you click "Connect Wallet":

1. **MetaMask will prompt** to add Hardhat Localhost network
2. **Click "Approve"** to add the network
3. **Click "Connect"** to connect your wallet

### Manual MetaMask Setup (if needed)
- **Network Name**: Hardhat Localhost
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 31337
- **Currency Symbol**: ETH

## 👛 Account Permissions

- **Issuers**: Accounts 0-1 (0xf39f..., 0x7099...)
- **Users**: Accounts 2-7 (0x3c44..., 0x90F3...)
- **Verifiers**: Accounts 8-9 (0x15d3..., 0x996D...)

## 🌐 Access Points

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:5001
- **Hardhat Node**: http://127.0.0.1:8545

## 🎯 Ready to Use!

1. Open http://localhost:5174
2. Click "Connect Wallet"
3. Approve network addition in MetaMask
4. Select appropriate account based on your role
5. Start using the Credence platform!

## 🐛 Troubleshooting

**Port Error?** Run: `for /f "tokens=5" %a in ('netstat -ano ^| findstr :5001') do taskkill /PID %a /F`

**MetaMask Not Connecting?** Ensure Hardhat node is running on port 8545

**Contracts Not Found?** Run `npm run deploy:local` in backend directory
