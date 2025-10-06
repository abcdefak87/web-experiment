/**
 * Error Logger untuk monitoring dan debugging
 * Log errors ke console (dev) atau server (production)
 */

interface ErrorLogEntry {
  timestamp: string
  level: 'error' | 'warning' | 'info'
  category: string
  message: string
  context?: string
  userId?: string
  userRole?: string
  page?: string
  action?: string
  stackTrace?: string
  additionalData?: Record<string, any>
}

class ErrorLogger {
  private static instance: ErrorLogger
  private logs: ErrorLogEntry[] = []
  private maxLogs = 100 // Keep last 100 logs in memory

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  /**
   * Log error dengan context
   */
  error(
    message: string,
    error?: any,
    context?: {
      page?: string
      action?: string
      userId?: string
      userRole?: string
      additionalData?: Record<string, any>
    }
  ) {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      category: this.categorizeError(error),
      message,
      context: context?.page,
      userId: context?.userId,
      userRole: context?.userRole,
      page: context?.page,
      action: context?.action,
      stackTrace: error?.stack,
      additionalData: context?.additionalData
    }

    this.addLog(entry)
    this.consoleLog(entry)
    this.sendToServer(entry)
  }

  /**
   * Log warning
   */
  warning(message: string, context?: Record<string, any>) {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warning',
      category: 'warning',
      message,
      additionalData: context
    }

    this.addLog(entry)
    this.consoleLog(entry)
  }

  /**
   * Log info untuk debugging
   */
  info(message: string, data?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data)
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 10): ErrorLogEntry[] {
    return this.logs.slice(-count)
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = []
  }

  /**
   * Private: Add log to memory
   */
  private addLog(entry: ErrorLogEntry) {
    this.logs.push(entry)
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  /**
   * Private: Console log dengan formatting
   */
  private consoleLog(entry: ErrorLogEntry) {
    const styles = {
      error: 'color: #ef4444; font-weight: bold;',
      warning: 'color: #f59e0b; font-weight: bold;',
      info: 'color: #3b82f6;'
    }

    if (process.env.NODE_ENV === 'development') {
      console.group(`%c[${entry.level.toUpperCase()}] ${entry.message}`, styles[entry.level])
      console.log('Time:', entry.timestamp)
      console.log('Category:', entry.category)
      if (entry.context) console.log('Context:', entry.context)
      if (entry.page) console.log('Page:', entry.page)
      if (entry.action) console.log('Action:', entry.action)
      if (entry.userId) console.log('User ID:', entry.userId)
      if (entry.stackTrace) console.log('Stack:', entry.stackTrace)
      if (entry.additionalData) console.log('Data:', entry.additionalData)
      console.groupEnd()
    }
  }

  /**
   * Private: Send error log to server
   */
  private async sendToServer(entry: ErrorLogEntry) {
    // Only send errors in production
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    try {
      // TODO: Implement server logging endpoint
      // await api.post('/logs/errors', entry)
      
      // For now, just log that we would send it
      console.log('[ErrorLogger] Would send to server in production:', entry.message)
    } catch (err) {
      // Silently fail - don't want logging to break the app
      console.error('[ErrorLogger] Failed to send log to server:', err)
    }
  }

  /**
   * Private: Categorize error type
   */
  private categorizeError(error: any): string {
    if (!error) return 'unknown'
    
    if (error.response) {
      const status = error.response.status
      if (status === 401) return 'authentication'
      if (status === 403) return 'authorization'
      if (status === 404) return 'not_found'
      if (status === 400 || status === 422) return 'validation'
      if (status >= 500) return 'server'
    }

    if (error.message?.includes('Network')) return 'network'
    if (error.message?.includes('timeout')) return 'timeout'
    
    return 'unknown'
  }
}

// Singleton instance
export const errorLogger = ErrorLogger.getInstance()

/**
 * Quick helper functions
 */

export const logError = (message: string, error?: any, context?: any) => {
  errorLogger.error(message, error, context)
}

export const logWarning = (message: string, context?: any) => {
  errorLogger.warning(message, context)
}

export const logInfo = (message: string, data?: any) => {
  errorLogger.info(message, data)
}

export default errorLogger

