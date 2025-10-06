// @ts-ignore - socket.io-client types will be installed
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

interface WebSocketMetrics {
  latency: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
  reconnectAttempts: number;
  totalMessages: number;
  errors: number;
}

interface ConnectionOptions {
  userId: string;
  role: string;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  onLatencyUpdate?: (latency: number) => void;
}

class EnhancedWebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private latencyCheckInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isTabVisible = true;
  private visibilityChangeHandler: (() => void) | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private currentUserId: string | null = null;
  private currentUserRole: string | null = null;
  private messageQueue: Array<{ event: string; data: any }> = [];
  private metrics: WebSocketMetrics = {
    latency: 0,
    connectionQuality: 'disconnected',
    reconnectAttempts: 0,
    totalMessages: 0,
    errors: 0
  };
  private callbacks: {
    onConnect?: () => void;
    onDisconnect?: (reason: string) => void;
    onError?: (error: Error) => void;
    onLatencyUpdate?: (latency: number) => void;
  } = {};

  constructor() {
    // Setup page visibility API handler
    if (typeof document !== 'undefined') {
      this.visibilityChangeHandler = this.handleVisibilityChange.bind(this);
      document.addEventListener('visibilitychange', this.visibilityChangeHandler);
      
      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  private handleVisibilityChange() {
    const wasVisible = this.isTabVisible;
    this.isTabVisible = !document.hidden;

    if (!wasVisible && this.isTabVisible) {
      console.log('[WebSocket] Tab became visible, checking connection...');
      if (!this.socket?.connected && !this.isConnecting) {
        this.scheduleReconnect(1000);
      }
    } else if (wasVisible && !this.isTabVisible) {
      console.log('[WebSocket] Tab became hidden, pausing heartbeat');
      this.stopHeartbeat();
    }
  }

  private handleOnline() {
    console.log('[WebSocket] Network came online');
    if (!this.socket?.connected && !this.isConnecting) {
      this.reconnect();
    }
  }

  private handleOffline() {
    console.log('[WebSocket] Network went offline');
    this.updateConnectionQuality('disconnected');
  }

  private calculateBackoffDelay(): number {
    // Exponential backoff with jitter
    const exponentialDelay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    // Add jitter (±25%)
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    return Math.round(exponentialDelay + jitter);
  }

  private scheduleReconnect(delay?: number) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const reconnectDelay = delay || this.calculateBackoffDelay();
    console.log(`[WebSocket] Scheduling reconnect in ${reconnectDelay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      if (!this.socket?.connected && !this.isConnecting) {
        this.reconnect();
      }
    }, reconnectDelay);
  }

  private updateConnectionQuality(quality?: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected') {
    if (quality) {
      this.metrics.connectionQuality = quality;
    } else {
      // Calculate based on latency
      const latency = this.metrics.latency;
      if (latency === 0) {
        this.metrics.connectionQuality = 'disconnected';
      } else if (latency < 50) {
        this.metrics.connectionQuality = 'excellent';
      } else if (latency < 150) {
        this.metrics.connectionQuality = 'good';
      } else if (latency < 300) {
        this.metrics.connectionQuality = 'fair';
      } else {
        this.metrics.connectionQuality = 'poor';
      }
    }
  }

  private startLatencyCheck() {
    this.stopLatencyCheck();
    
    this.latencyCheckInterval = setInterval(() => {
      if (this.socket?.connected) {
        const start = Date.now();
        this.socket.emit('ping', () => {
          const latency = Date.now() - start;
          this.metrics.latency = latency;
          this.updateConnectionQuality();
          
          // Report to server for metrics
          this.socket?.emit('report-latency', latency);
          
          // Callback for UI updates
          if (this.callbacks.onLatencyUpdate) {
            this.callbacks.onLatencyUpdate(latency);
          }
        });
      }
    }, 5000); // Check every 5 seconds
  }

  private stopLatencyCheck() {
    if (this.latencyCheckInterval) {
      clearInterval(this.latencyCheckInterval);
      this.latencyCheckInterval = null;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected && this.isTabVisible) {
        this.socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 25000); // Every 25 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private processMessageQueue() {
    if (this.socket?.connected && this.messageQueue.length > 0) {
      console.log(`[WebSocket] Processing ${this.messageQueue.length} queued messages`);
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        if (message) {
          this.socket.emit(message.event, message.data);
        }
      }
    }
  }

  connect(options: ConnectionOptions): Socket | null {
    const { userId, role, onConnect, onDisconnect, onError, onLatencyUpdate } = options;

    // Store callbacks
    this.callbacks = { onConnect, onDisconnect, onError, onLatencyUpdate };

    // If already connected with same user, return existing socket
    if (this.socket?.connected && this.currentUserId === userId) {
      console.log('[WebSocket] Already connected with same user');
      return this.socket;
    }

    // If connecting, wait
    if (this.isConnecting) {
      console.log('[WebSocket] Connection already in progress');
      return this.socket;
    }

    // If different user, disconnect first
    if (this.currentUserId && this.currentUserId !== userId) {
      console.log('[WebSocket] Different user detected, disconnecting first');
      this.disconnect();
    }

    this.isConnecting = true;
    this.currentUserId = userId;
    this.currentUserRole = role;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
      const token = Cookies.get('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Clean up existing socket
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      console.log(`[WebSocket] Connecting to ${wsUrl}...`);

      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: false, // We handle reconnection manually
        auth: {
          token
        },
        query: {
          userId,
          role
        }
      });

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('[WebSocket] Connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.metrics.reconnectAttempts = 0;
        this.updateConnectionQuality('excellent');
        
        // Start monitoring
        this.startHeartbeat();
        this.startLatencyCheck();
        
        // Process queued messages
        this.processMessageQueue();
        
        // Join rooms
        this.socket?.emit('join-room', { 
          roomType: role === 'customer' ? 'customer' : (role === 'teknisi' || role === 'technician') ? 'teknisi' : 'admin',
          roomId: userId 
        });
        
        // Callback
        if (onConnect) onConnect();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[WebSocket] Disconnected:', reason);
        this.isConnecting = false;
        this.updateConnectionQuality('disconnected');
        this.stopHeartbeat();
        this.stopLatencyCheck();
        
        // Callback
        if (onDisconnect) onDisconnect(reason);
        
        // Handle reconnection based on disconnect reason
        if (reason === 'io server disconnect') {
          // Server disconnected us, don't auto-reconnect
          console.log('[WebSocket] Server disconnected, not auto-reconnecting');
        } else if (reason === 'transport close' || reason === 'transport error') {
          // Network issue, try to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.metrics.reconnectAttempts = this.reconnectAttempts;
            this.scheduleReconnect();
          } else {
            console.error('[WebSocket] Max reconnection attempts reached');
          }
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error.message);
        this.isConnecting = false;
        this.metrics.errors++;
        
        // Callback
        if (onError) onError(error);
        
        // Handle specific error types
        if (error.message.includes('Authentication')) {
          console.error('[WebSocket] Authentication failed, not reconnecting');
          // Clear invalid token
          Cookies.remove('token');
        } else if (error.message.includes('Rate limit')) {
          console.warn('[WebSocket] Rate limited, backing off');
          this.reconnectAttempts = Math.min(this.reconnectAttempts + 2, this.maxReconnectAttempts);
          this.scheduleReconnect(this.maxReconnectDelay);
        } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.metrics.reconnectAttempts = this.reconnectAttempts;
          this.scheduleReconnect();
        }
      });

      this.socket.on('error', (error) => {
        console.error('[WebSocket] Socket error:', error);
        this.metrics.errors++;
        if (onError) onError(new Error(error.message || 'Socket error'));
      });

      // Handle rate limiting from server
      this.socket.on('rate_limit', (data) => {
        console.warn('[WebSocket] Rate limited by server:', data);
        // Slow down client operations
        this.messageQueue = []; // Clear queue to reduce load
      });

      return this.socket;
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      this.isConnecting = false;
      this.metrics.errors++;
      if (onError) onError(error as Error);
      return null;
    }
  }

  reconnect() {
    if (this.currentUserId && this.currentUserRole) {
      console.log('[WebSocket] Attempting to reconnect...');
      this.connect({
        userId: this.currentUserId,
        role: this.currentUserRole,
        ...this.callbacks
      });
    }
  }

  disconnect() {
    console.log('[WebSocket] Disconnecting...');
    
    // Clear timers
    this.stopHeartbeat();
    this.stopLatencyCheck();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Clear queue
    this.messageQueue = [];

    // Disconnect socket
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Reset state
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.currentUserId = null;
    this.currentUserRole = null;
    this.updateConnectionQuality('disconnected');
  }

  emit(event: string, data: any, queueIfDisconnected = true) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      this.metrics.totalMessages++;
    } else if (queueIfDisconnected) {
      console.log(`[WebSocket] Queueing message for event: ${event}`);
      this.messageQueue.push({ event, data });
      
      // Limit queue size to prevent memory issues
      if (this.messageQueue.length > 100) {
        this.messageQueue.shift(); // Remove oldest message
      }
    }
  }

  on(event: string, handler: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event: string, handler?: (...args: any[]) => void) {
    if (this.socket) {
      if (handler) {
        this.socket.off(event, handler);
      } else {
        this.socket.off(event);
      }
    }
  }

  getMetrics(): WebSocketMetrics {
    return { ...this.metrics };
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionQuality(): string {
    return this.metrics.connectionQuality;
  }

  cleanup() {
    console.log('[WebSocket] Cleaning up...');
    
    // Remove event listeners
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    
    // Disconnect
    this.disconnect();
  }
}

// Export singleton instance
const websocketService = new EnhancedWebSocketService();

export default websocketService;
export { EnhancedWebSocketService, type WebSocketMetrics, type ConnectionOptions };
