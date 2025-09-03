import web3Service from './web3.js';

class BlockchainNotificationService {
  constructor() {
    this.notifications = new Map(); // Store notifications in memory by user address
    this.listeners = new Map(); // Store active event listeners
    this.isInitialized = false;
  }

  // Initialize the service
  async init() {
    if (this.isInitialized) return true;
    
    try {
      await web3Service.init();
      this.isInitialized = true;
      console.log('✅ BlockchainNotificationService initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize BlockchainNotificationService:', error);
      return false;
    }
  }

  // Generate unique notification ID based on credential data
  generateNotificationId(credentialId, issuer, holder) {
    return `${credentialId}-${issuer}-${holder}`.toLowerCase();
  }

  // Create notification object from blockchain event
  createNotificationFromEvent(eventData, isPastEvent = false) {
    const notificationId = this.generateNotificationId(
      eventData.credentialId, 
      eventData.issuer, 
      eventData.holder
    );

    // Format the issue date for display
    const issueDate = new Date(eventData.issueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return {
      id: notificationId,
      type: 'credential_issued',
      title: 'You have received a credential',
      message: `Issued on ${issueDate}`,
      data: {
        credentialId: eventData.credentialId.toString(),
        credentialType: eventData.credentialType,
        credentialTitle: eventData.credentialTitle,
        issuerName: `Issuer ${eventData.issuer.slice(-4)}`,
        issuerDID: eventData.issuerDID,
        issuerAddress: eventData.issuer,
        issueDate: eventData.issueDate,
        expiryDate: eventData.expiryDate,
        status: 'active',
        blockNumber: eventData.blockNumber,
        transactionHash: eventData.transactionHash,
        metadata: eventData.data
      },
      read: false,
      priority: 'high',
      createdAt: eventData.timestamp || new Date().toISOString(),
      isPastEvent
    };
  }

  // Get all notifications for a user
  getNotifications(userAddress) {
    if (!userAddress) return [];
    
    const userKey = userAddress.toLowerCase();
    const userNotifications = this.notifications.get(userKey) || [];
    
    // Sort by creation date, newest first
    return userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Get unread notification count
  getUnreadCount(userAddress) {
    const notifications = this.getNotifications(userAddress);
    return notifications.filter(n => !n.read).length;
  }

  // Add notification to user's list (avoid duplicates)
  addNotification(userAddress, notification) {
    if (!userAddress) return false;
    
    const userKey = userAddress.toLowerCase();
    const userNotifications = this.notifications.get(userKey) || [];
    
    // Check if notification already exists
    const exists = userNotifications.some(n => n.id === notification.id);
    if (exists) {
      console.log(`⚠️ Notification ${notification.id} already exists for ${userAddress}`);
      return false;
    }
    
    userNotifications.push(notification);
    this.notifications.set(userKey, userNotifications);
    
    console.log(`✅ Added notification ${notification.id} for ${userAddress}`);
    return true;
  }

  // Mark notification as read
  markAsRead(userAddress, notificationId) {
    if (!userAddress) return false;
    
    const userKey = userAddress.toLowerCase();
    const userNotifications = this.notifications.get(userKey) || [];
    
    const notification = userNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      console.log(`✅ Marked notification ${notificationId} as read for ${userAddress}`);
      return true;
    }
    
    return false;
  }

  // Mark all notifications as read for a user
  markAllAsRead(userAddress) {
    if (!userAddress) return false;
    
    const userKey = userAddress.toLowerCase();
    const userNotifications = this.notifications.get(userKey) || [];
    
    let markedCount = 0;
    userNotifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        markedCount++;
      }
    });
    
    console.log(`✅ Marked ${markedCount} notifications as read for ${userAddress}`);
    return markedCount;
  }

  // Fetch and process past credential events for a user
  async fetchPastEvents(userAddress) {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      console.log(`📜 Fetching past credential events for ${userAddress}`);
      
      // Get past events from blockchain
      const pastEvents = await web3Service.getPastCredentialEvents(userAddress, 0);
      console.log(`📜 Found ${pastEvents.length} past events for ${userAddress}`);
      
      let addedCount = 0;
      
      // Create notifications for each past event
      for (const eventData of pastEvents) {
        const notification = this.createNotificationFromEvent(eventData, true);
        const added = this.addNotification(userAddress, notification);
        if (added) {
          addedCount++;
        }
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log(`✅ Added ${addedCount} notifications from past events for ${userAddress}`);
      return addedCount;
    } catch (error) {
      console.error('❌ Error fetching past events:', error);
      return 0;
    }
  }

  // Start real-time event listening for a user
  async startEventListener(userAddress, onNewNotification = null) {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      const listenerKey = userAddress.toLowerCase();
      
      // Stop existing listener if any
      this.stopEventListener(userAddress);
      
      console.log(`🎧 Starting real-time event listener for ${userAddress}`);
      
      // Event handler for new credentials
      const eventHandler = async (eventData) => {
        console.log('🔔 New CredentialIssued event detected!', eventData);
        
        // Create notification from event
        const notification = this.createNotificationFromEvent(eventData, false);
        const added = this.addNotification(userAddress, notification);
        
        if (added && onNewNotification) {
          // Call the callback with the new notification
          onNewNotification(notification);
        }
      };
      
      // Start listening using web3Service
      const success = await web3Service.startListeningForCredentialEvents(userAddress, eventHandler);
      
      if (success) {
        this.listeners.set(listenerKey, {
          userAddress,
          handler: eventHandler,
          startedAt: new Date().toISOString()
        });
        
        console.log(`✅ Successfully started event listener for ${userAddress}`);
        return true;
      } else {
        console.error(`❌ Failed to start event listener for ${userAddress}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error starting event listener:', error);
      return false;
    }
  }

  // Stop event listener for a user
  stopEventListener(userAddress) {
    try {
      const listenerKey = userAddress.toLowerCase();
      const listener = this.listeners.get(listenerKey);
      
      if (listener) {
        web3Service.stopListeningForCredentialEvents(userAddress);
        this.listeners.delete(listenerKey);
        console.log(`🔇 Stopped event listener for ${userAddress}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error stopping event listener:', error);
      return false;
    }
  }

  // Setup complete notification system for a user (past events + real-time)
  async setupNotifications(userAddress, onNewNotification = null) {
    try {
      console.log(`🚀 Setting up complete notification system for ${userAddress}`);
      
      // First, fetch past events
      const pastCount = await this.fetchPastEvents(userAddress);
      
      // Then start real-time listener
      const listenerStarted = await this.startEventListener(userAddress, onNewNotification);
      
      console.log(`✅ Notification setup complete for ${userAddress}: ${pastCount} past events, listener: ${listenerStarted}`);
      
      return {
        success: true,
        pastEventsCount: pastCount,
        realtimeListenerActive: listenerStarted
      };
    } catch (error) {
      console.error('❌ Error setting up notifications:', error);
      return {
        success: false,
        pastEventsCount: 0,
        realtimeListenerActive: false,
        error: error.message
      };
    }
  }

  // Cleanup all listeners and data for a user
  cleanup(userAddress = null) {
    try {
      if (userAddress) {
        // Cleanup specific user
        const userKey = userAddress.toLowerCase();
        this.stopEventListener(userAddress);
        this.notifications.delete(userKey);
        console.log(`🧹 Cleaned up notifications for ${userAddress}`);
      } else {
        // Cleanup all
        console.log(`🧹 Cleaning up all notification listeners and data`);
        
        // Stop all listeners
        for (const [userAddress] of this.listeners) {
          this.stopEventListener(userAddress);
        }
        
        // Clear all data
        this.notifications.clear();
        this.listeners.clear();
        
        console.log('✅ All notification data cleaned up');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return false;
    }
  }

  // Get service status
  getStatus() {
    return {
      initialized: this.isInitialized,
      activeListeners: this.listeners.size,
      usersWithNotifications: this.notifications.size,
      totalNotifications: Array.from(this.notifications.values()).reduce((total, userNotifications) => total + userNotifications.length, 0)
    };
  }

  // Debug method to log current state
  debug() {
    console.log('=== BLOCKCHAIN NOTIFICATION SERVICE DEBUG ===');
    console.log('Status:', this.getStatus());
    console.log('Active Listeners:', Array.from(this.listeners.keys()));
    console.log('Users with Notifications:', Array.from(this.notifications.keys()));
    
    for (const [userAddress, notifications] of this.notifications) {
      console.log(`User ${userAddress}: ${notifications.length} notifications (${notifications.filter(n => !n.read).length} unread)`);
    }
    console.log('=============================================');
  }
}

// Create and export singleton instance
const blockchainNotificationService = new BlockchainNotificationService();
export default blockchainNotificationService;
