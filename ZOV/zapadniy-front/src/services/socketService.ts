import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { User, Region } from '../types';

// Use a relative URL for WebSocket connection
const SOCKET_URL = '/ws';

class SocketService {
  private stompClient: Client | null = null;
  private userId: string | null = null;
  private subscriptions: any[] = [];

  connect(userId: string): void {
    this.userId = userId;
    
    const socket = new SockJS(SOCKET_URL);
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      debug: function(str) {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Socket connected for user:', userId);
      
      // Send connect message
      this.stompClient?.publish({
        destination: '/app/connect',
        body: userId
      });
      
      // Subscribe to user-specific and global topics
      this.subscribeToTopics();
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers['message']);
      console.error('Additional details:', frame.body);
    };

    this.stompClient.activate();
  }

  private subscribeToTopics(): void {
    if (!this.stompClient || !this.userId) return;
    
    // Clear any existing subscriptions
    this.clearSubscriptions();
    
    // Subscribe to global topics
    this.subscriptions.push(
      this.stompClient.subscribe('/topic/user-location-update', (message) => {
        const user = JSON.parse(message.body);
        if (this.callbacks.userLocationUpdate) {
          this.callbacks.userLocationUpdate(user);
        }
      })
    );
    
    this.subscriptions.push(
      this.stompClient.subscribe('/topic/region-status-update', (message) => {
        const region = JSON.parse(message.body);
        if (this.callbacks.regionStatusUpdate) {
          this.callbacks.regionStatusUpdate(region);
        }
      })
    );
    
    this.subscriptions.push(
      this.stompClient.subscribe('/topic/missile-launch', (message) => {
        const data = JSON.parse(message.body);
        if (this.callbacks.missileLaunch) {
          this.callbacks.missileLaunch(data);
        }
      })
    );
    
    // Subscribe to user-specific topics
    this.subscriptions.push(
      this.stompClient.subscribe(`/user/${this.userId}/queue/users-nearby-update`, (message) => {
        const users = JSON.parse(message.body);
        if (this.callbacks.usersNearbyUpdate) {
          this.callbacks.usersNearbyUpdate(users);
        }
      })
    );
    
    this.subscriptions.push(
      this.stompClient.subscribe(`/user/${this.userId}/queue/social-rating-update`, (message) => {
        const user = JSON.parse(message.body);
        if (this.callbacks.socialRatingUpdate) {
          this.callbacks.socialRatingUpdate(user);
        }
      })
    );
  }

  private clearSubscriptions(): void {
    this.subscriptions.forEach(subscription => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    this.subscriptions = [];
  }

  disconnect(): void {
    this.clearSubscriptions();
    
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
      this.userId = null;
      console.log('Socket disconnected');
    }
  }

  // Callback storage
  private callbacks: {
    userLocationUpdate?: (user: User) => void;
    usersNearbyUpdate?: (users: User[]) => void;
    regionStatusUpdate?: (region: Region) => void;
    missileLaunch?: (data: { regionId: string, missileType: string }) => void;
    socialRatingUpdate?: (user: User) => void;
  } = {};

  onUserLocationUpdate(callback: (user: User) => void): void {
    this.callbacks.userLocationUpdate = callback;
  }

  onUsersNearbyUpdate(callback: (users: User[]) => void): void {
    this.callbacks.usersNearbyUpdate = callback;
  }

  onRegionStatusUpdate(callback: (region: Region) => void): void {
    this.callbacks.regionStatusUpdate = callback;
  }

  onMissileLaunch(callback: (data: { regionId: string, missileType: string }) => void): void {
    this.callbacks.missileLaunch = callback;
  }

  onSocialRatingUpdate(callback: (user: User) => void): void {
    this.callbacks.socialRatingUpdate = callback;
  }

  updateLocation(latitude: number, longitude: number): void {
    if (!this.stompClient || !this.userId) return;
    
    this.stompClient.publish({
      destination: '/app/update-location',
      body: JSON.stringify({
        userId: this.userId,
        location: { latitude, longitude }
      })
    });
  }

  ratePerson(targetUserId: string, ratingChange: number): void {
    if (!this.stompClient || !this.userId) return;
    
    this.stompClient.publish({
      destination: '/app/rate-person',
      body: JSON.stringify({
        userId: this.userId,
        targetUserId,
        ratingChange
      })
    });
  }

  isConnected(): boolean {
    return this.stompClient !== null && this.stompClient.connected;
  }
}

export const socketService = new SocketService(); 