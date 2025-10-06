/**
 * Centralized Error Handler
 * Provides consistent error handling dan user-friendly messages
 */

import toast from 'react-hot-toast'
import { AxiosError } from 'axios'

export type ErrorCategory = 
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'server'
  | 'unknown'

export interface ErrorDetails {
  category: ErrorCategory
  message: string
  userMessage: string
  statusCode?: number
  fieldErrors?: Record<string, string>
  canRetry: boolean
  suggestedAction?: string
}

export class ErrorHandler {
  private error: any
  private context?: string

  constructor(error: any, context?: string) {
    this.error = error
    this.context = context
  }

  /**
   * Analyze error and get structured details
   */
  getDetails(): ErrorDetails {
    // Network errors
    if (this.isNetworkError()) {
      return {
        category: 'network',
        message: this.error.message,
        userMessage: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        canRetry: true,
        suggestedAction: 'Coba lagi dalam beberapa saat'
      }
    }

    // Axios errors
    if (this.error.isAxiosError || this.error.response) {
      const axiosError = this.error as AxiosError<any>
      const status = axiosError.response?.status
      const data = axiosError.response?.data

      // Authentication errors (401)
      if (status === 401) {
        return {
          category: 'authentication',
          message: 'Unauthorized',
          userMessage: 'Sesi Anda telah berakhir. Silakan login kembali.',
          statusCode: 401,
          canRetry: false,
          suggestedAction: 'Klik tombol login di bawah'
        }
      }

      // Authorization errors (403)
      if (status === 403) {
        return {
          category: 'authorization',
          message: 'Forbidden',
          userMessage: 'Anda tidak memiliki akses untuk melakukan tindakan ini.',
          statusCode: 403,
          canRetry: false,
          suggestedAction: 'Hubungi administrator untuk akses'
        }
      }

      // Not found errors (404)
      if (status === 404) {
        return {
          category: 'not_found',
          message: 'Not Found',
          userMessage: data?.error || 'Data yang Anda cari tidak ditemukan.',
          statusCode: 404,
          canRetry: false,
          suggestedAction: 'Periksa kembali atau refresh halaman'
        }
      }

      // Validation errors (400, 422)
      if (status === 400 || status === 422) {
        const fieldErrors = this.extractFieldErrors(data)
        return {
          category: 'validation',
          message: data?.error || 'Validation Error',
          userMessage: data?.error || 'Data yang Anda masukkan tidak valid.',
          statusCode: status,
          fieldErrors,
          canRetry: true,
          suggestedAction: 'Perbaiki data yang ditandai dan coba lagi'
        }
      }

      // Server errors (500+)
      if (status && status >= 500) {
        return {
          category: 'server',
          message: 'Server Error',
          userMessage: 'Terjadi kesalahan di server. Tim kami sudah diberitahu.',
          statusCode: status,
          canRetry: true,
          suggestedAction: 'Coba lagi dalam beberapa menit'
        }
      }

      // Other API errors
      return {
        category: 'unknown',
        message: data?.error || axiosError.message,
        userMessage: data?.error || 'Terjadi kesalahan yang tidak terduga.',
        statusCode: status,
        canRetry: true
      }
    }

    // Unknown errors
    return {
      category: 'unknown',
      message: this.error.message || 'Unknown error',
      userMessage: 'Terjadi kesalahan yang tidak terduga.',
      canRetry: true,
      suggestedAction: 'Coba refresh halaman atau hubungi support'
    }
  }

  /**
   * Check if error is network related
   */
  isNetworkError(): boolean {
    return (
      this.error.message?.includes('Network Error') ||
      this.error.message?.includes('fetch') ||
      this.error.message?.includes('timeout') ||
      this.error.code === 'ECONNABORTED' ||
      !navigator.onLine
    )
  }

  /**
   * Check if error is authentication related
   */
  isAuthError(): boolean {
    return this.getDetails().category === 'authentication'
  }

  /**
   * Check if error is validation related
   */
  isValidationError(): boolean {
    return this.getDetails().category === 'validation'
  }

  /**
   * Check if retry is possible
   */
  canRetry(): boolean {
    return this.getDetails().canRetry
  }

  /**
   * Extract field-specific errors from API response
   */
  private extractFieldErrors(data: any): Record<string, string> {
    const errors: Record<string, string> = {}

    // Express-validator format
    if (data?.errors && Array.isArray(data.errors)) {
      data.errors.forEach((err: any) => {
        if (err.param && err.msg) {
          errors[err.param] = err.msg
        }
      })
    }

    // Custom format
    if (data?.fieldErrors) {
      return data.fieldErrors
    }

    return errors
  }

  /**
   * Show error toast dengan UI yang sesuai
   */
  showToast(options?: { retry?: () => void; duration?: number }) {
    const details = this.getDetails()
    const { retry, duration = 4000 } = options || {}

    // Network errors dengan retry button
    if (details.category === 'network' && retry) {
      const message = details.userMessage + '\n' + (details.suggestedAction || 'Klik untuk coba lagi')
      toast.error(message, { duration })
      return
    }

    // Authentication errors
    if (details.category === 'authentication') {
      toast.error(details.userMessage, {
        duration: 6000,
        icon: '🔐'
      })
      // Redirect to login after 2 seconds
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }, 2000)
      return
    }

    // Validation errors dengan field details
    if (details.category === 'validation') {
      if (details.fieldErrors && Object.keys(details.fieldErrors).length > 0) {
        const firstError = Object.values(details.fieldErrors)[0]
        toast.error(firstError, { duration })
      } else {
        toast.error(details.userMessage, { duration })
      }
      return
    }

    // Default error toast
    const message = details.userMessage + (details.suggestedAction ? `\n${details.suggestedAction}` : '')
    toast.error(message, { duration })
  }

  /**
   * Log error untuk debugging (development) atau monitoring (production)
   */
  log() {
    const details = this.getDetails()
    
    console.error('Error Handler:', {
      category: details.category,
      message: details.message,
      userMessage: details.userMessage,
      statusCode: details.statusCode,
      context: this.context,
      timestamp: new Date().toISOString(),
      error: this.error
    })

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc)
      // errorTracker.log({
      //   error: this.error,
      //   context: this.context,
      //   user: getCurrentUser(),
      //   ...details
      // })
    }
  }
}

/**
 * Helper function untuk handle error dengan retry
 */
export const handleErrorWithRetry = (
  error: any,
  retry: () => void,
  context?: string
) => {
  const handler = new ErrorHandler(error, context)
  handler.log()
  handler.showToast({ retry })
}

/**
 * Helper function untuk handle error tanpa retry
 */
export const handleError = (error: any, context?: string) => {
  const handler = new ErrorHandler(error, context)
  handler.log()
  handler.showToast()
}

/**
 * Helper function untuk get field errors untuk forms
 */
export const getFieldErrors = (error: any): Record<string, string> => {
  const handler = new ErrorHandler(error)
  return handler.getDetails().fieldErrors || {}
}

export default ErrorHandler

