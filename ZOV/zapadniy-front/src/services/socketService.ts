import { io, Socket } from 'socket.io-client';
import { User, Region } from '../types';

const SOCKET_URL = 'http://localhost:8080';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string): void {
    this.userId = userId;
    this.socket = io(SOCKET_URL, {
      query: { userId }
    });
    
    console.log('Socket connected for user:', userId);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      console.log('Socket disconnected');
    }
  }

  onUserLocationUpdate(callback: (user: User) => void): void {
    if (!this.socket) return;
    
    this.socket.on('user-location-update', (data: User) => {
      callback(data);
    });
  }

  onUsersNearbyUpdate(callback: (users: User[]) => void): void {
    if (!this.socket) return;
    
    this.socket.on('users-nearby-update', (data: User[]) => {
      callback(data);
    });
  }

  onRegionStatusUpdate(callback: (region: Region) => void): void {
    if (!this.socket) return;
    
    this.socket.on('region-status-update', (data: Region) => {
      callback(data);
    });
  }

  onMissileLaunch(callback: (data: { regionId: string, missileType: string }) => void): void {
    if (!this.socket) return;
    
    this.socket.on('missile-launch', (data) => {
      callback(data);
    });
  }

  updateLocation(latitude: number, longitude: number): void {
    if (!this.socket) return;
    
    this.socket.emit('update-location', {
      userId: this.userId,
      location: { latitude, longitude }
    });
  }

  ratePerson(targetUserId: string, ratingChange: number): void {
    if (!this.socket) return;
    
    this.socket.emit('rate-person', {
      userId: this.userId,
      targetUserId,
      ratingChange
    });
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }
}

export const socketService = new SocketService(); 