import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import websocketService, { WebSocketMetrics } from '../lib/websocketEnhanced';
import { useEffect } from 'react';

interface WebSocketState {
  // Connection state
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
  latency: number;
  reconnectAttempts: number;
  
  // Metrics
  totalMessages: number;
  errors: number;
  lastError: string | null;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  
  // User info
  userId: string | null;
  userRole: string | null;
  
  // Actions
  connect: (userId: string, role: string) => void;
  disconnect: () => void;
  updateMetrics: (metrics: Partial<WebSocketMetrics>) => void;
  setConnectionStatus: (isConnected: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
  
  // Real-time data subscriptions
  subscriptions: Map<string, Function>;
  subscribe: (event: string, handler: Function) => void;
  unsubscribe: (event: string) => void;
  unsubscribeAll: () => void;
}

const useWebSocketStore = create<WebSocketState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isConnected: false,
        connectionQuality: 'disconnected',
        latency: 0,
        reconnectAttempts: 0,
        totalMessages: 0,
        errors: 0,
        lastError: null,
        lastConnectedAt: null,
        lastDisconnectedAt: null,
        userId: null,
        userRole: null,
        subscriptions: new Map(),

        // Connect to WebSocket
        connect: (userId: string, role: string) => {
          const state = get();
          
          // Don't reconnect if already connected with same user
          if (state.isConnected && state.userId === userId) {
            console.log('[WebSocketStore] Already connected with same user');
            return;
          }

          console.log('[WebSocketStore] Connecting...', { userId, role });

          websocketService.connect({
            userId,
            role,
            onConnect: () => {
              console.log('[WebSocketStore] Connected successfully');
              set({
                isConnected: true,
                connectionQuality: 'excellent',
                lastConnectedAt: new Date(),
                userId,
                userRole: role,
                reconnectAttempts: 0,
                lastError: null
              });

              // Re-subscribe to all events
              const subscriptions = get().subscriptions;
              subscriptions.forEach((handler, event) => {
                websocketService.on(event, handler as any);
              });
            },
            onDisconnect: (reason: string) => {
              console.log('[WebSocketStore] Disconnected:', reason);
              set({
                isConnected: false,
                connectionQuality: 'disconnected',
                lastDisconnectedAt: new Date(),
                lastError: reason
              });
            },
            onError: (error: Error) => {
              console.error('[WebSocketStore] Error:', error);
              set((state) => ({
                errors: state.errors + 1,
                lastError: error.message
              }));
            },
            onLatencyUpdate: (latency: number) => {
              const quality = 
                latency < 50 ? 'excellent' :
                latency < 150 ? 'good' :
                latency < 300 ? 'fair' : 'poor';
              
              set({
                latency,
                connectionQuality: quality
              });
            }
          });
        },

        // Disconnect from WebSocket
        disconnect: () => {
          console.log('[WebSocketStore] Disconnecting...');
          websocketService.disconnect();
          set({
            isConnected: false,
            connectionQuality: 'disconnected',
            lastDisconnectedAt: new Date(),
            userId: null,
            userRole: null
          });
        },

        // Update metrics
        updateMetrics: (metrics: Partial<WebSocketMetrics>) => {
          set((state) => ({
            ...state,
            ...metrics
          }));
        },

        // Set connection status
        setConnectionStatus: (isConnected: boolean) => {
          set({
            isConnected,
            connectionQuality: isConnected ? 'good' : 'disconnected',
            lastConnectedAt: isConnected ? new Date() : get().lastConnectedAt,
            lastDisconnectedAt: !isConnected ? new Date() : get().lastDisconnectedAt
          });
        },

        // Set error
        setError: (error: string) => {
          set((state) => ({
            errors: state.errors + 1,
            lastError: error
          }));
        },

        // Clear error
        clearError: () => {
          set({ lastError: null });
        },

        // Subscribe to WebSocket event
        subscribe: (event: string, handler: Function) => {
          const subscriptions = get().subscriptions;
          subscriptions.set(event, handler);
          
          // If connected, subscribe immediately
          if (get().isConnected) {
            websocketService.on(event, handler as any);
          }
          
          set({ subscriptions });
        },

        // Unsubscribe from WebSocket event
        unsubscribe: (event: string) => {
          const subscriptions = get().subscriptions;
          const handler = subscriptions.get(event);
          
          if (handler) {
            websocketService.off(event, handler as any);
            subscriptions.delete(event);
            set({ subscriptions });
          }
        },

        // Unsubscribe from all events
        unsubscribeAll: () => {
          const subscriptions = get().subscriptions;
          subscriptions.forEach((handler, event) => {
            websocketService.off(event, handler as any);
          });
          subscriptions.clear();
          set({ subscriptions });
        }
      }),
      {
        name: 'websocket-store',
        // Don't persist connection state and subscriptions
        partialize: (state) => ({
          userId: state.userId,
          userRole: state.userRole,
          lastConnectedAt: state.lastConnectedAt,
          lastDisconnectedAt: state.lastDisconnectedAt,
          totalMessages: state.totalMessages,
          errors: state.errors
        })
      }
    ),
    {
      name: 'WebSocketStore'
    }
  )
);

// Helper hooks for specific use cases
export const useConnectionStatus = () => {
  const isConnected = useWebSocketStore((state) => state.isConnected);
  const connectionQuality = useWebSocketStore((state) => state.connectionQuality);
  const latency = useWebSocketStore((state) => state.latency);
  
  return { isConnected, connectionQuality, latency };
};

export const useWebSocketMetrics = () => {
  const metrics = useWebSocketStore((state) => ({
    latency: state.latency,
    connectionQuality: state.connectionQuality,
    reconnectAttempts: state.reconnectAttempts,
    totalMessages: state.totalMessages,
    errors: state.errors
  }));
  
  return metrics;
};

export const useWebSocketSubscription = (event: string, handler: Function) => {
  const subscribe = useWebSocketStore((state) => state.subscribe);
  const unsubscribe = useWebSocketStore((state) => state.unsubscribe);
  
  // Subscribe on mount, unsubscribe on unmount
  useEffect(() => {
    subscribe(event, handler);
    return () => unsubscribe(event);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
};

export default useWebSocketStore;
