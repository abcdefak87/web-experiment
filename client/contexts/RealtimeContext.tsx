import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { SocketClient } from '../lib/socket-client'
import toast from 'react-hot-toast'

interface RealtimeContextType {
  isConnected: boolean
  notifications: Notification[]
  markAsRead: (id: string) => void
  clearAll: () => void
  sendMessage: (event: string, data: any) => void
  onJobUpdate: (callback: (data: any) => void) => () => void
  onCustomerUpdate: (callback: (data: any) => void) => () => void
  onInventoryUpdate: (callback: (data: any) => void) => () => void
  onSystemNotification: (callback: (data: any) => void) => () => void
  onWhatsAppStatusUpdate: (callback: (data: any) => void) => () => void
}

interface Notification {
  id: string
  type: 'job' | 'customer' | 'inventory' | 'system' | 'customer-notification'
  title: string
  message: string
  timestamp: Date
  read: boolean
  data?: any
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const socketClientRef = useRef<SocketClient | null>(null)
  const eventHandlersRef = useRef<Map<string, Set<Function>>>(new Map())
  const handleMessageRef = useRef<((data: any) => void) | null>(null)

  // Initialize WebSocket connection
  useEffect(() => {
    if (!loading && user?.id) {
      console.log('[RealtimeContext] Initializing Socket.IO connection...')
      
      // Create Socket.IO client
      const client = new SocketClient({
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        userId: user.id,
        role: user.role,
        reconnect: true,
        reconnectDelay: 5000,
        reconnectAttempts: 3,
        debug: process.env.NODE_ENV === 'development'
      })
      
      socketClientRef.current = client
      
      // Handle connection events
      client.addListener('connected', () => {
        console.log('[RealtimeContext] Socket.IO connected')
        setIsConnected(true)
        // Temporarily disabled toast notification
        // toast.success('🔗 Real-time connection established', { duration: 2000 })
      })
      
      client.addListener('disconnected', () => {
        console.log('[RealtimeContext] Socket.IO disconnected')
        setIsConnected(false)
      })
      
      client.addListener('reconnecting', (attempt: number) => {
        console.log(`[RealtimeContext] Reconnecting... Attempt ${attempt}`)
        // Temporarily disabled toast notification to prevent UI blocking
        // if (attempt === 1) {
        //   toast.loading('Reconnecting to server...', { id: 'reconnecting' })
        // }
      })
      
      client.addListener('error', (error: any) => {
        console.error('[RealtimeContext] WebSocket error:', error)
      })
      
      client.addListener('max_reconnect_attempts', () => {
        console.error('[RealtimeContext] Max reconnect attempts reached')
        // Temporarily disabled toast notification
        // toast.error('Failed to connect to server. Please refresh the page.', { 
        //   duration: 5000,
        //   id: 'reconnecting' 
        // })
      })
      
      // Handle incoming messages
      client.addListener('message', (data: any) => {
        if (handleMessageRef.current) {
          handleMessageRef.current(data)
        }
      })
      
      // Connect to server
      client.connect()
      
      // Handle connection error
      client.addListener('connect_error', (error: any) => {
        console.error('[RealtimeContext] Failed to connect:', error)
      })
      
      // Cleanup on unmount
      return () => {
        console.log('[RealtimeContext] Cleaning up Socket.IO connection')
        // Copy refs to local variables to avoid stale closure issues
        const currentClient = socketClientRef.current
        const currentHandlers = eventHandlersRef.current
        
        if (currentClient) {
          currentClient.disconnect()
          socketClientRef.current = null
        }
        if (currentHandlers) {
          currentHandlers.clear()
        }
      }
    }
  }, [user, loading])
  
  // Add notification - defined first as it's used by other handlers
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)) // Keep last 50 notifications
    
    // Show toast for important notifications
    if (notification.type === 'job' || notification.type === 'customer') {
      toast(notification.message, { icon: '🔔', duration: 4000 })
    }
  }, [])
  
  // Handle incoming messages
  const handleMessage = useCallback((data: any) => {
    console.log('[RealtimeContext] Received message:', data)
    
    // Handle different message types
    switch (data.type) {
      case 'job:update':
        handleJobUpdate(data.data)
        break
      case 'customer:update':
        handleCustomerUpdate(data.data)
        break
      case 'inventory:update':
        handleInventoryUpdate(data.data)
        break
      case 'system:notification':
        handleSystemNotification(data.data)
        break
      case 'whatsapp:status':
        handleWhatsAppStatus(data.data)
        break
      case 'notification':
        addNotification(data.data)
        break
      default:
        // Trigger event handlers
        const handlers = eventHandlersRef.current.get(data.type)
        if (handlers) {
          handlers.forEach(handler => handler(data.data))
        }
    }
  }, [addNotification]) // Other handlers are called inside but defined after
  
  // Handle job updates
  const handleJobUpdate = useCallback((data: any) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'job',
      title: 'Job Update',
      message: getJobUpdateMessage(data),
      timestamp: new Date(),
      read: false,
      data
    }
    
    addNotification(notification)
    
    // Trigger job update handlers
    const handlers = eventHandlersRef.current.get('job:update')
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }, [addNotification])
  
  // Handle customer updates
  const handleCustomerUpdate = useCallback((data: any) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'customer',
      title: 'Customer Update',
      message: getCustomerUpdateMessage(data),
      timestamp: new Date(),
      read: false,
      data
    }
    
    addNotification(notification)
    
    // Trigger customer update handlers
    const handlers = eventHandlersRef.current.get('customer:update')
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }, [addNotification])
  
  // Handle inventory updates
  const handleInventoryUpdate = useCallback((data: any) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'inventory',
      title: 'Inventory Update',
      message: data.message || 'Inventory has been updated',
      timestamp: new Date(),
      read: false,
      data
    }
    
    addNotification(notification)
    
    // Trigger inventory update handlers
    const handlers = eventHandlersRef.current.get('inventory:update')
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }, [addNotification])
  
  // Handle system notifications
  const handleSystemNotification = useCallback((data: any) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'system',
      title: 'System Notification',
      message: data.message || 'System notification',
      timestamp: new Date(),
      read: false,
      data
    }
    
    addNotification(notification)
    toast(data.message, { icon: '📢' })
    
    // Trigger system notification handlers
    const handlers = eventHandlersRef.current.get('system:notification')
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }, [addNotification])
  
  // Handle WhatsApp status updates
  const handleWhatsAppStatus = useCallback((data: any) => {
    // Trigger WhatsApp status handlers
    const handlers = eventHandlersRef.current.get('whatsapp:status')
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }, [])
  
  // Send message through WebSocket
  const sendMessage = useCallback((event: string, data: any) => {
    if (socketClientRef.current?.isConnected) {
      socketClientRef.current.sendMessage(event, data)
    } else {
      console.warn('[RealtimeContext] Cannot send message, WebSocket not connected')
    }
  }, [])
  
  // Subscribe to events
  const subscribe = useCallback((event: string, callback: Function) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set())
    }
    eventHandlersRef.current.get(event)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const handlers = eventHandlersRef.current.get(event)
      if (handlers) {
        handlers.delete(callback)
        if (handlers.size === 0) {
          eventHandlersRef.current.delete(event)
        }
      }
    }
  }, [])
  
  // Event subscription helpers
  const onJobUpdate = useCallback((callback: (data: any) => void) => {
    return subscribe('job:update', callback)
  }, [subscribe])
  
  const onCustomerUpdate = useCallback((callback: (data: any) => void) => {
    return subscribe('customer:update', callback)
  }, [subscribe])
  
  const onInventoryUpdate = useCallback((callback: (data: any) => void) => {
    return subscribe('inventory:update', callback)
  }, [subscribe])
  
  const onSystemNotification = useCallback((callback: (data: any) => void) => {
    return subscribe('system:notification', callback)
  }, [subscribe])
  
  const onWhatsAppStatusUpdate = useCallback((callback: (data: any) => void) => {
    return subscribe('whatsapp:status', callback)
  }, [subscribe])
  
  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])
  
  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])
  
  // Helper functions for notification messages
  function getJobUpdateMessage(data: any): string {
    if (data.action === 'created') {
      return `New job #${data.job?.id} created for ${data.job?.customer?.name || 'Unknown'}`
    } else if (data.action === 'updated') {
      return `Job #${data.job?.id} has been updated`
    } else if (data.action === 'status_changed') {
      return `Job #${data.job?.id} status changed to ${data.job?.status}`
    } else if (data.action === 'assigned') {
      return `Job #${data.job?.id} assigned to technician`
    }
    return 'Job has been updated'
  }
  
  function getCustomerUpdateMessage(data: any): string {
    if (data.action === 'created') {
      return `New customer ${data.customer?.name || 'Unknown'} registered`
    } else if (data.action === 'updated') {
      return `Customer ${data.customer?.name || 'Unknown'} information updated`
    }
    return 'Customer information has been updated'
  }
  
  const value: RealtimeContextType = {
    isConnected,
    notifications,
    markAsRead,
    clearAll,
    sendMessage,
    onJobUpdate,
    onCustomerUpdate,
    onInventoryUpdate,
    onSystemNotification,
    onWhatsAppStatusUpdate
  }
  
  // Assign handleMessage to ref for use in useEffect
  useEffect(() => {
    handleMessageRef.current = handleMessage
  }, [handleMessage])
  
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}
