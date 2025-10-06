import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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
  setConnectionStatus: (isConnected: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
}

const useWebSocketStore = create<WebSocketState>()(
  devtools(
    (set) => ({
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

      // Connect to WebSocket
      connect: (userId: string, role: string) => {
        // For now, just update the state
        // The actual WebSocket connection will be handled separately
        set({
          userId,
          userRole: role,
          isConnected: false, // Will be updated when actually connected
          lastError: null
        });
      },

      // Disconnect from WebSocket
      disconnect: () => {
        set({
          isConnected: false,
          connectionQuality: 'disconnected',
          lastDisconnectedAt: new Date(),
          userId: null,
          userRole: null
        });
      },

      // Set connection status
      setConnectionStatus: (isConnected: boolean) => {
        set((state) => ({
          isConnected,
          connectionQuality: isConnected ? 'good' : 'disconnected',
          lastConnectedAt: isConnected ? new Date() : state.lastConnectedAt,
          lastDisconnectedAt: !isConnected ? new Date() : state.lastDisconnectedAt
        }));
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
      }
    }),
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

export default useWebSocketStore;
