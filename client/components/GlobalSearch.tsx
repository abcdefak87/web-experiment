/**
 * Global Search Component (Command Palette)
 * Keyboard shortcut: Ctrl+K atau Cmd+K
 */

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import { 
  Search, 
  Users, 
  Briefcase, 
  Package, 
  UserCheck,
  Clock,
  Zap,
  TrendingUp,
  FileText,
  Settings,
  ArrowRight
} from 'lucide-react'
import { ICON_SIZES } from '../lib/iconSizes'
import { useEscapeKey, useLockBodyScroll, useFocusTrap } from '../hooks/useEscapeKey'
import { api } from '../lib/api'
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from '../hooks/useKeyboardShortcuts'
import toast from 'react-hot-toast'

interface SearchResult {
  id: string
  type: 'technician' | 'job' | 'customer' | 'inventory' | 'page'
  title: string
  subtitle?: string
  description?: string
  icon: any
  action: () => void
  category: string
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Keyboard navigation
  useEscapeKey(onClose, isOpen)
  useLockBodyScroll(isOpen)
  useFocusTrap(modalRef, isOpen)

  // Load recent searches
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('recentSearches')
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to load recent searches:', e)
        }
      }
      
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults(getQuickActions())
      return
    }

    const timer = setTimeout(() => {
      performSearch(query)
    }, 300) // Debounce 300ms

    return () => clearTimeout(timer)
  }, [query])

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[selectedIndex]) {
          executeAction(results[selectedIndex])
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, results])

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true)

    try {
      // Search multiple endpoints in parallel
      const [technicians, jobs, customers] = await Promise.all([
        api.get(`/technicians?search=${searchQuery}&limit=5`).catch(() => ({ data: { data: { technicians: [] } } })),
        api.get(`/jobs?search=${searchQuery}&limit=5`).catch(() => ({ data: { data: [] } })),
        api.get(`/customers?search=${searchQuery}&limit=5`).catch(() => ({ data: { data: { customers: [] } } }))
      ])

      const searchResults: SearchResult[] = []

      // Add technicians
      const techList = technicians.data.data?.technicians || []
      techList.forEach((tech: any) => {
        searchResults.push({
          id: tech.id,
          type: 'technician',
          title: tech.name,
          subtitle: tech.phone,
          description: tech.status,
          icon: Users,
          category: 'Teknisi',
          action: () => router.push(`/technicians/${tech.id}`)
        })
      })

      // Add jobs
      const jobList = Array.isArray(jobs.data.data) ? jobs.data.data : []
      jobList.forEach((job: any) => {
        searchResults.push({
          id: job.id,
          type: 'job',
          title: job.jobNumber,
          subtitle: job.customer?.name,
          description: `${job.category} - ${job.status}`,
          icon: Briefcase,
          category: 'Job',
          action: () => router.push(`/jobs/${job.id}`)
        })
      })

      // Add customers
      const custList = customers.data.data?.customers || []
      custList.forEach((cust: any) => {
        searchResults.push({
          id: cust.id,
          type: 'customer',
          title: cust.name,
          subtitle: cust.phone,
          description: cust.address,
          icon: UserCheck,
          category: 'Pelanggan',
          action: () => router.push(`/pelanggan?id=${cust.id}`)
        })
      })

      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Gagal mencari data')
    } finally {
      setIsSearching(false)
    }
  }

  const getQuickActions = (): SearchResult[] => {
    return [
      {
        id: 'new-job',
        type: 'page',
        title: 'Buat Tiket Baru',
        description: 'Tambah PSB atau Gangguan',
        icon: Zap,
        category: 'Quick Action',
        action: () => router.push('/jobs/create')
      },
      {
        id: 'technicians',
        type: 'page',
        title: 'Kelola Teknisi',
        description: 'Lihat dan kelola daftar teknisi',
        icon: Users,
        category: 'Navigate',
        action: () => router.push('/technicians')
      },
      {
        id: 'inventory',
        type: 'page',
        title: 'Inventory',
        description: 'Kelola stok barang',
        icon: Package,
        category: 'Navigate',
        action: () => router.push('/inventory')
      },
      {
        id: 'customers',
        type: 'page',
        title: 'Pelanggan',
        description: 'Daftar semua pelanggan',
        icon: UserCheck,
        category: 'Navigate',
        action: () => router.push('/pelanggan')
      },
      {
        id: 'reports',
        type: 'page',
        title: 'Laporan',
        description: 'Lihat statistik dan laporan',
        icon: TrendingUp,
        category: 'Navigate',
        action: () => router.push('/reports')
      }
    ]
  }

  const executeAction = (result: SearchResult) => {
    // Save to recent searches
    if (query.trim()) {
      const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
    }

    // Execute action
    result.action()
    
    // Close search
    onClose()
    setQuery('')
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
    toast.success('Riwayat pencarian dihapus')
  }

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    results.forEach(result => {
      if (!groups[result.category]) {
        groups[result.category] = []
      }
      groups[result.category].push(result)
    })
    return groups
  }, [results])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-start justify-center z-[100] pt-20"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-title"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className={`absolute left-3 top-3 ${ICON_SIZES.md} text-gray-400`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari teknisi, job, pelanggan... (Ctrl+K)"
              className="w-full pl-10 pr-4 py-3 text-base border-0 focus:ring-0 focus:outline-none bg-transparent"
              aria-label="Global search"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div 
          ref={resultsRef}
          className="max-h-96 overflow-y-auto"
        >
          {isSearching ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">Mencari...</p>
            </div>
          ) : results.length === 0 && query ? (
            <div className="p-8 text-center">
              <Search className={`${ICON_SIZES['2xl']} text-gray-300 mx-auto mb-3`} />
              <p className="text-sm font-medium text-gray-900">Tidak ada hasil</p>
              <p className="text-sm text-gray-600 mt-1">Coba kata kunci lain</p>
            </div>
          ) : results.length === 0 && !query && recentSearches.length > 0 ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase">Pencarian Terakhir</h3>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-blue-600 hover:text-blue-700"
                  aria-label="Hapus riwayat"
                >
                  Hapus
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(search)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg flex items-center space-x-2"
                >
                  <Clock className={`${ICON_SIZES.sm} text-gray-400`} />
                  <span className="text-sm text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedResults).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {category}
                  </h3>
                  {items.map((result, index) => {
                    const globalIndex = results.indexOf(result)
                    const isSelected = globalIndex === selectedIndex
                    const Icon = result.icon

                    return (
                      <button
                        key={result.id}
                        onClick={() => executeAction(result)}
                        className={`w-full px-4 py-3 text-left transition-colors flex items-center space-x-3 ${
                          isSelected ? 'bg-blue-50 border-l-2 border-blue-600' : 'hover:bg-gray-50'
                        }`}
                        aria-label={`${result.title} - ${result.category}`}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`${ICON_SIZES.md} ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                            {result.type !== 'page' && result.subtitle && (
                              <span className="text-xs text-gray-600">·</span>
                            )}
                            {result.subtitle && (
                              <p className="text-xs text-gray-600 truncate">{result.subtitle}</p>
                            )}
                          </div>
                          {result.description && (
                            <p className="text-xs text-gray-600 truncate mt-0.5">{result.description}</p>
                          )}
                        </div>
                        {isSelected && (
                          <ArrowRight className={`${ICON_SIZES.sm} text-blue-600 flex-shrink-0`} />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with hints */}
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">↵</kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded">ESC</kbd>
              <span>Close</span>
            </span>
          </div>
          {results.length > 0 && (
            <span>{results.length} hasil</span>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook untuk menggunakan Global Search
 */
export const useGlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false)

  // Ctrl+K or Cmd+K keyboard shortcut
  useKeyboardShortcuts([
    {
      ...COMMON_SHORTCUTS.SEARCH,
      callback: () => setIsOpen(true)
    }
  ])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  }
}

