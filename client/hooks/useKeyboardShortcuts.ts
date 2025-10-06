import { useEffect } from 'react'

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  callback: (event: KeyboardEvent) => void
  description?: string
}

/**
 * Custom hook untuk menangani keyboard shortcuts global
 * Support kombinasi key seperti Ctrl+K, Ctrl+Shift+P, dll
 * 
 * @param shortcuts - Array of keyboard shortcuts
 * @param enabled - Flag untuk enable/disable shortcuts (default: true)
 * 
 * @example
 * ```tsx
 * const App = () => {
 *   useKeyboardShortcuts([
 *     {
 *       key: 'k',
 *       ctrlKey: true,
 *       callback: () => openSearch(),
 *       description: 'Open search'
 *     },
 *     {
 *       key: '/',
 *       callback: () => focusSearchBox(),
 *       description: 'Focus search'
 *     }
 *   ])
 * }
 * ```
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey
        const shiftMatch = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey
        const altMatch = shortcut.altKey === undefined || event.altKey === shortcut.altKey
        const metaMatch = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          // Don't prevent default if user is typing in input/textarea
          const target = event.target as HTMLElement
          const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
          const isContentEditable = target.isContentEditable

          if (!isTyping && !isContentEditable) {
            event.preventDefault()
            shortcut.callback(event)
            break
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts, enabled])
}

/**
 * Predefined keyboard shortcuts untuk common actions
 */
export const COMMON_SHORTCUTS = {
  SEARCH: { key: 'k', ctrlKey: true, description: 'Search' },
  CLOSE: { key: 'Escape', description: 'Close/Cancel' },
  SAVE: { key: 's', ctrlKey: true, description: 'Save' },
  HELP: { key: '?', shiftKey: true, description: 'Show help' },
  FOCUS_SEARCH: { key: '/', description: 'Focus search box' },
  NEW: { key: 'n', ctrlKey: true, description: 'New item' },
  EDIT: { key: 'e', ctrlKey: true, description: 'Edit' },
  DELETE: { key: 'Delete', description: 'Delete' },
  REFRESH: { key: 'r', ctrlKey: true, description: 'Refresh' },
}

export default useKeyboardShortcuts

