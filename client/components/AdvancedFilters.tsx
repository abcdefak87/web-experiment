/**
 * Advanced Filters Component
 * Reusable filter UI dengan multiple filter types
 */

import React, { useState } from 'react'
import { Filter, X, Calendar, Search } from 'lucide-react'
import { ICON_SIZES } from '../lib/iconSizes'

export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'daterange' | 'search' | 'checkbox'
  options?: { value: string; label: string }[]
  placeholder?: string
}

export interface FilterValues {
  [key: string]: any
}

interface AdvancedFiltersProps {
  filters: FilterConfig[]
  values: FilterValues
  onChange: (values: FilterValues) => void
  onApply?: () => void
  onReset?: () => void
}

export default function AdvancedFilters({
  filters,
  values,
  onChange,
  onApply,
  onReset
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleChange = (key: string, value: any) => {
    onChange({ ...values, [key]: value })
  }

  const handleReset = () => {
    const resetValues: FilterValues = {}
    filters.forEach(filter => {
      resetValues[filter.key] = filter.type === 'multiselect' ? [] : ''
    })
    onChange(resetValues)
    if (onReset) onReset()
  }

  const activeFilterCount = Object.values(values).filter(v => 
    v && (Array.isArray(v) ? v.length > 0 : true)
  ).length

  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'select':
        return (
          <select
            value={values[filter.key] || ''}
            onChange={(e) => handleChange(filter.key, e.target.value)}
            className="form-input"
            aria-label={filter.label}
          >
            <option value="">{filter.placeholder || `Semua ${filter.label}`}</option>
            {filter.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            {filter.options?.map(opt => (
              <label key={opt.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(values[filter.key] || []).includes(opt.value)}
                  onChange={(e) => {
                    const current = values[filter.key] || []
                    const updated = e.target.checked
                      ? [...current, opt.value]
                      : current.filter((v: string) => v !== opt.value)
                    handleChange(filter.key, updated)
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  aria-label={opt.label}
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        )

      case 'daterange':
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={values[`${filter.key}_from`] || ''}
              onChange={(e) => handleChange(`${filter.key}_from`, e.target.value)}
              className="form-input"
              aria-label={`${filter.label} dari`}
            />
            <input
              type="date"
              value={values[`${filter.key}_to`] || ''}
              onChange={(e) => handleChange(`${filter.key}_to`, e.target.value)}
              className="form-input"
              aria-label={`${filter.label} sampai`}
            />
          </div>
        )

      case 'search':
        return (
          <div className="relative">
            <Search className={`absolute left-3 top-3 ${ICON_SIZES.sm} text-gray-400`} />
            <input
              type="text"
              value={values[filter.key] || ''}
              onChange={(e) => handleChange(filter.key, e.target.value)}
              placeholder={filter.placeholder || `Cari ${filter.label}...`}
              className="form-input pl-10"
              aria-label={filter.label}
            />
          </div>
        )

      case 'checkbox':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={values[filter.key] || false}
              onChange={(e) => handleChange(filter.key, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              aria-label={filter.label}
            />
            <span className="text-sm text-gray-700">{filter.label}</span>
          </label>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header dengan toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        aria-label="Toggle filters"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-2">
          <Filter className={`${ICON_SIZES.md} text-gray-600`} />
          <span className="text-sm font-medium text-gray-900">Filter</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeFilterCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleReset()
              }}
              className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1"
              aria-label="Reset semua filter"
            >
              Reset
            </button>
          )}
          <span className="text-gray-400">
            {isExpanded ? '−' : '+'}
          </span>
        </div>
      </button>

      {/* Filter Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map(filter => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {filter.label}
                </label>
                {renderFilter(filter)}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {onApply && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={handleReset}
                className="btn btn-outline btn-sm"
                aria-label="Reset filter"
              >
                Reset
              </button>
              <button
                onClick={onApply}
                className="btn btn-primary btn-sm"
                aria-label="Terapkan filter"
              >
                Terapkan Filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Quick Filter Buttons - for common filters
 */
interface QuickFilterProps {
  label: string
  value: string
  active: boolean
  onClick: () => void
  count?: number
}

export const QuickFilterButton = ({ label, value, active, onClick, count }: QuickFilterProps) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
    aria-label={`Filter ${label}`}
    aria-pressed={active}
  >
    {label}
    {count !== undefined && count > 0 && (
      <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
        active ? 'bg-blue-500' : 'bg-gray-300'
      }`}>
        {count}
      </span>
    )}
  </button>
)

/**
 * Filter Pills - Show active filters
 */
interface FilterPillsProps {
  filters: FilterValues
  filterConfig: FilterConfig[]
  onRemove: (key: string) => void
  onClear: () => void
}

export const FilterPills = ({ filters, filterConfig, onRemove, onClear }: FilterPillsProps) => {
  const activeFilters = Object.entries(filters).filter(([_, value]) => {
    if (Array.isArray(value)) return value.length > 0
    return value && value !== ''
  })

  if (activeFilters.length === 0) return null

  const getFilterLabel = (key: string, value: any): string => {
    const config = filterConfig.find(f => f.key === key)
    if (!config) return `${key}: ${value}`

    if (Array.isArray(value)) {
      return `${config.label}: ${value.length} selected`
    }

    const option = config.options?.find(opt => opt.value === value)
    return `${config.label}: ${option?.label || value}`
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Active Filters:</span>
      {activeFilters.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
        >
          <span>{getFilterLabel(key, value)}</span>
          <button
            onClick={() => onRemove(key)}
            className="hover:text-blue-900"
            aria-label={`Remove ${key} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClear}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        aria-label="Clear all filters"
      >
        Clear All
      </button>
    </div>
  )
}

