/**
 * API-specific error handling utilities
 * Wrapper functions untuk common API error scenarios
 */

import { ErrorHandler, handleError, handleErrorWithRetry } from './errorHandler'
import toast from 'react-hot-toast'

/**
 * Handle API call dengan automatic error handling
 */
export async function apiCall<T>(
  apiFunction: () => Promise<T>,
  options?: {
    context?: string
    onSuccess?: (data: T) => void
    onError?: (error: any) => void
    retry?: () => void
    successMessage?: string
    showSuccessToast?: boolean
  }
): Promise<T | null> {
  try {
    const result = await apiFunction()
    
    // Show success message if provided
    if (options?.successMessage && options?.showSuccessToast !== false) {
      toast.success(options.successMessage)
    }
    
    // Call success callback
    if (options?.onSuccess) {
      options.onSuccess(result)
    }
    
    return result
  } catch (error: any) {
    // Log error
    const handler = new ErrorHandler(error, options?.context)
    handler.log()
    
    // Call custom error handler if provided
    if (options?.onError) {
      options.onError(error)
    } else {
      // Use default error handling
      if (options?.retry) {
        handler.showToast({ retry: options.retry })
      } else {
        handler.showToast()
      }
    }
    
    return null
  }
}

/**
 * Wrapper untuk fetch operations dengan loading state
 */
export async function fetchWithLoading<T>(
  apiFunction: () => Promise<T>,
  setLoading: (loading: boolean) => void,
  options?: {
    context?: string
    onSuccess?: (data: T) => void
    onError?: (error: any) => void
  }
): Promise<T | null> {
  setLoading(true)
  
  try {
    const result = await apiFunction()
    
    if (options?.onSuccess) {
      options.onSuccess(result)
    }
    
    return result
  } catch (error: any) {
    const handler = new ErrorHandler(error, options?.context)
    handler.log()
    handler.showToast()
    
    if (options?.onError) {
      options.onError(error)
    }
    
    return null
  } finally {
    setLoading(false)
  }
}

/**
 * Wrapper untuk mutation operations (create, update, delete)
 */
export async function mutationWithFeedback<T>(
  apiFunction: () => Promise<T>,
  options: {
    loadingMessage: string
    successMessage: string
    errorContext?: string
    onSuccess?: (data: T) => void
    onError?: (error: any) => void
  }
): Promise<T | null> {
  // Show loading toast
  const loadingToast = toast.loading(options.loadingMessage)
  
  try {
    const result = await apiFunction()
    
    // Dismiss loading and show success
    toast.dismiss(loadingToast)
    toast.success(options.successMessage)
    
    if (options.onSuccess) {
      options.onSuccess(result)
    }
    
    return result
  } catch (error: any) {
    // Dismiss loading toast
    toast.dismiss(loadingToast)
    
    // Handle error
    const handler = new ErrorHandler(error, options.errorContext)
    handler.log()
    handler.showToast()
    
    if (options.onError) {
      options.onError(error)
    }
    
    return null
  }
}

/**
 * Retry function dengan exponential backoff
 */
export async function retryWithBackoff<T>(
  apiFunction: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiFunction()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        throw error
      }
      
      // Wait before retry dengan exponential backoff
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

/**
 * Check online status
 */
export const isOnline = (): boolean => {
  return navigator.onLine
}

/**
 * Wait for online connection
 */
export const waitForOnline = (): Promise<void> => {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve()
      return
    }

    const handleOnline = () => {
      window.removeEventListener('online', handleOnline)
      resolve()
    }

    window.addEventListener('online', handleOnline)
  })
}

export default {
  apiCall,
  fetchWithLoading,
  mutationWithFeedback,
  retryWithBackoff,
  isOnline,
  waitForOnline
}

