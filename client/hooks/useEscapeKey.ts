import { useEffect } from 'react'

/**
 * Custom hook untuk menangani ESC key press
 * Digunakan untuk menutup modal/dialog dengan keyboard
 * 
 * @param callback - Function yang dipanggil saat ESC ditekan
 * @param enabled - Flag untuk enable/disable handler (default: true)
 * 
 * @example
 * ```tsx
 * const Modal = ({ isOpen, onClose }) => {
 *   useEscapeKey(onClose, isOpen)
 *   return <div>Modal content</div>
 * }
 * ```
 */
export const useEscapeKey = (callback: () => void, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        callback()
      }
    }

    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [callback, enabled])
}

/**
 * Custom hook untuk lock body scroll saat modal terbuka
 * Mencegah background scroll saat modal aktif
 * 
 * @param isLocked - Flag untuk lock/unlock scroll
 * 
 * @example
 * ```tsx
 * const Modal = ({ isOpen }) => {
 *   useLockBodyScroll(isOpen)
 *   return <div>Modal content</div>
 * }
 * ```
 */
export const useLockBodyScroll = (isLocked: boolean = false) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight

    if (isLocked) {
      // Prevent scrollbar jump
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.paddingRight = `${scrollbarWidth}px`
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
    }
  }, [isLocked])
}

/**
 * Custom hook untuk trap focus di dalam modal
 * Memastikan Tab navigation hanya di dalam modal
 * 
 * @param elementRef - Ref ke modal element
 * @param isActive - Flag untuk activate trap
 * 
 * @example
 * ```tsx
 * const Modal = ({ isOpen }) => {
 *   const modalRef = useRef<HTMLDivElement>(null)
 *   useFocusTrap(modalRef, isOpen)
 *   return <div ref={modalRef}>Modal content</div>
 * }
 * ```
 */
export const useFocusTrap = (
  elementRef: React.RefObject<HTMLElement>,
  isActive: boolean = false
) => {
  useEffect(() => {
    if (!isActive || !elementRef.current) return

    const element = elementRef.current
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element on mount
    firstElement?.focus()

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    element.addEventListener('keydown', handleTabKey)
    
    return () => {
      element.removeEventListener('keydown', handleTabKey)
    }
  }, [elementRef, isActive])
}

export default useEscapeKey

