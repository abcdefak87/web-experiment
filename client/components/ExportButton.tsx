/**
 * Export Button Component
 * Dropdown button untuk export data ke berbagai format
 */

import React, { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText, Printer, ChevronDown } from 'lucide-react'
import { ICON_SIZES } from '../lib/iconSizes'
import { exportToCSV, exportToExcel, exportToPDF, printPage, generateFilename } from '../lib/exportUtils'
import { useEscapeKey } from '../hooks/useEscapeKey'
import toast from 'react-hot-toast'

export interface ExportButtonProps {
  data: any[]
  filename?: string
  columns?: { key: string; label: string }[]
  title?: string
  formats?: ('csv' | 'excel' | 'pdf' | 'print')[]
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'outline'
}

export default function ExportButton({
  data,
  filename = 'data',
  columns,
  title,
  formats = ['csv', 'excel', 'pdf', 'print'],
  disabled = false,
  variant = 'outline'
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on ESC
  useEscapeKey(() => setIsOpen(false), isOpen)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleExport = async (format: string) => {
    if (!data || data.length === 0) {
      toast.error('Tidak ada data untuk di-export')
      return
    }

    setIsExporting(true)
    setIsOpen(false)

    try {
      const fname = generateFilename(filename)

      switch (format) {
        case 'csv':
          exportToCSV(data, fname, columns)
          toast.success('Data berhasil di-export ke CSV')
          break

        case 'excel':
          try {
            await exportToExcel(data, fname, {
              columns,
              autoWidth: true,
              sheetName: title || 'Data'
            })
            toast.success('Data berhasil di-export ke Excel')
          } catch (err: any) {
            if (err.message?.includes('belum terinstall')) {
              toast.error('Excel export memerlukan library tambahan. Gunakan CSV untuk saat ini.', { duration: 5000 })
            } else {
              throw err
            }
          }
          break

        case 'pdf':
          try {
            await exportToPDF(data, fname, {
              title,
              columns,
              orientation: 'landscape'
            })
            toast.success('Data berhasil di-export ke PDF')
          } catch (err: any) {
            if (err.message?.includes('belum terinstall')) {
              toast.error('PDF export memerlukan library tambahan. Gunakan CSV untuk saat ini.', { duration: 5000 })
            } else {
              throw err
            }
          }
          break

        case 'print':
          printPage()
          break

        default:
          toast.error('Format tidak didukung')
      }
    } catch (error: any) {
      console.error('Export error:', error)
      
      if (error.message?.includes('belum terinstall')) {
        toast.error(error.message, { duration: 6000 })
      } else {
        toast.error('Gagal export data: ' + error.message)
      }
    } finally {
      setIsExporting(false)
    }
  }

  const formatConfig = {
    csv: {
      icon: FileText,
      label: 'CSV',
      description: 'Comma-separated values'
    },
    excel: {
      icon: FileSpreadsheet,
      label: 'Excel',
      description: 'Microsoft Excel (.xlsx)'
    },
    pdf: {
      icon: FileText,
      label: 'PDF',
      description: 'Portable Document Format'
    },
    print: {
      icon: Printer,
      label: 'Print',
      description: 'Cetak halaman'
    }
  }

  const buttonClass = `btn btn-${variant} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => !disabled && !isExporting && setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className={buttonClass}
        aria-label="Export data"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Download className={`${ICON_SIZES.sm} mr-2`} />
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        <ChevronDown className={`${ICON_SIZES.sm} ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {formats.map((format) => {
              const config = formatConfig[format]
              const Icon = config.icon

              return (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start space-x-3"
                  aria-label={`Export sebagai ${config.label}`}
                >
                  <Icon className={`${ICON_SIZES.md} text-gray-600 flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{config.label}</div>
                    <div className="text-xs text-gray-600">{config.description}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Info footer */}
          <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-600">
              {data.length} baris data akan di-export
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Simple export button tanpa dropdown (direct CSV export)
 */
export const QuickExportButton = ({
  data,
  filename = 'data',
  columns
}: Pick<ExportButtonProps, 'data' | 'filename' | 'columns'>) => {
  const handleClick = () => {
    try {
      exportToCSV(data, generateFilename(filename), columns)
      toast.success('Data berhasil di-export')
    } catch (error: any) {
      toast.error('Gagal export data: ' + error.message)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="btn btn-outline"
      disabled={!data || data.length === 0}
      aria-label="Export data ke CSV"
    >
      <Download className={`${ICON_SIZES.sm} mr-2`} />
      Export CSV
    </button>
  )
}

