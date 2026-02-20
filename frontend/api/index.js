import express from 'express';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple in-memory storage for Vercel deployment
const storage = {
  users: new Map(),
  credentials: new Map(),
  verificationRequests: new Map(),
  notifications: new Map(),
  sharedCredentials: new Map()
};

// Initialize with some test data
const testIssuer = {
  id: "test-issuer-1",
  address: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  did: "did:ethr:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  name: "Test Issuer",
  email: "issuer@example.com",
  userType: "issuer",
  createdAt: new Date()
};
storage.users.set(testIssuer.id, testIssuer);

const testUser = {
  id: "test-user-1",
  address: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
  did: "did:ethr:0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
  name: "Test User",
  email: "user@example.com",
  userType: "user",
  createdAt: new Date()
};
storage.users.set(testUser.id, testUser);

// Helper functions
function getUserByAddress(address) {
  return Array.from(storage.users.values()).find(user => user.address === address.toLowerCase());
}

function getUserByDID(did) {
  const normalizedDID = did.toLowerCase();
  return Array.from(storage.users.values()).find(user => user.did?.toLowerCase() === normalizedDID);
}

function createUser(userData) {
  const id = Math.random().toString(36).substr(2, 9);
  const user = {
    ...userData,
    id,
    createdAt: new Date()
  };
  storage.users.set(id, user);
  return user;
}

function getCredentialsByUserId(userId) {
  return Array.from(storage.credentials.values()).filter(cred => cred.userId === userId);
}

function createCredential(credentialData) {
  const id = Math.random().toString(36).substr(2, 9);
  const credential = {
    ...credentialData,
    id,
    createdAt: new Date()
  };
  storage.credentials.set(id, credential);
  return credential;
}

function getNotificationsByUserId(userId) {
  return Array.from(storage.notifications.values())
    .filter(notification => notification.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function createNotification(notificationData) {
  const id = Math.random().toString(36).substr(2, 9);
  const notification = {
    ...notificationData,
    id,
    createdAt: new Date()
  };
  storage.notifications.set(id, notification);
  return notification;
}

// API Routes
app.post('/api/auth/connect', async (req, res) => {
  try {
    const { address, userType = 'user' } = req.body;
    if (!address) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }
    
    const normalizedAddress = address.toLowerCase();
    let user = getUserByAddress(normalizedAddress);
    
    if (!user) {
      const did = `did:ethr:${address}`;
      const name = `User ${address.slice(-4)}`;
      user = createUser({
        address: normalizedAddress,
        did: `did:ethr:${normalizedAddress}`,
        name,
        userType,
        email: `${name.toLowerCase()}@example.com`
      });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/users/did/:did', async (req, res) => {
  try {
    const did = decodeURIComponent(req.params.did);
    let user = getUserByDID(did);
    
    if (!user) {
      // Try to extract address from DID
      let extractedAddress = null;
      if (did.startsWith('did:ethr:')) {
        extractedAddress = did.replace('did:ethr:', '').toLowerCase();
      } else if (did.startsWith('0x') && did.length === 42) {
        extractedAddress = did.toLowerCase();
      }
      
      if (extractedAddress) {
        user = getUserByAddress(extractedAddress);
      }
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/credentials/user/:userId', async (req, res) => {
  try {
    const credentials = getCredentialsByUserId(req.params.userId);
    res.json(credentials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/credentials', async (req, res) => {
  try {
    const credential = createCredential(req.body);
    res.json(credential);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/notifications/user/:userId', async (req, res) => {
  try {
    const notifications = getNotificationsByUserId(req.params.userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/test/notification', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }
    
    const user = getUserByAddress(walletAddress.toLowerCase());
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const notification = createNotification({
      userId: user.id,
      type: 'credential_issued',
      title: 'Test Credential Issued',
      message: 'This is a test notification to verify the notification system is working.',
      data: {
        credentialId: 'test-123',
        credentialType: 'Test Certificate',
        issuerName: 'Test Issuer'
      },
      read: false,
      priority: 'high'
    });
    
    res.json({
      message: 'Test notification created successfully',
      notification,
      user: { id: user.id, address: user.address, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default function handler(req, res) {
  app(req, res);
}
