/**
 * Export Utilities
 * Handle data export ke berbagai format (CSV, Excel, PDF)
 */

/**
 * Export data ke CSV format
 */
export const exportToCSV = (
  data: any[],
  filename: string = 'export',
  columns?: { key: string; label: string }[]
) => {
  if (!data || data.length === 0) {
    throw new Error('Tidak ada data untuk di-export')
  }

  // Get headers
  const headers = columns 
    ? columns.map(col => col.label)
    : Object.keys(data[0])

  const keys = columns
    ? columns.map(col => col.key)
    : Object.keys(data[0])

  // Create CSV content
  const csvContent = [
    // Headers
    headers.join(','),
    // Data rows
    ...data.map(row => 
      keys.map(key => {
        const value = row[key]
        // Handle special characters and newlines
        if (value === null || value === undefined) return ''
        const stringValue = String(value).replace(/"/g, '""')
        return `"${stringValue}"`
      }).join(',')
    )
  ].join('\n')

  // Add BOM for Excel UTF-8 support
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // Download file
  downloadBlob(blob, `${filename}.csv`)
}

/**
 * Export data ke Excel format (requires xlsx library)
 * Install: npm install xlsx
 * 
 * NOTE: Function ini akan error saat build jika xlsx belum terinstall.
 * Untuk sementara gunakan CSV export.
 */
export const exportToExcel = async (
  data: any[],
  filename: string = 'export',
  options?: {
    sheetName?: string
    columns?: { key: string; label: string }[]
    autoWidth?: boolean
  }
) => {
  throw new Error('Excel export memerlukan library xlsx. Install dengan: npm install xlsx\n\nGunakan CSV export untuk saat ini.')
  
  /* UNCOMMENT AFTER INSTALLING xlsx:
  
  if (!data || data.length === 0) {
    throw new Error('Tidak ada data untuk di-export')
  }

  const XLSX = await import('xlsx')
  
  // Prepare data
  const exportData = options?.columns
    ? data.map(row => {
        const obj: any = {}
        options.columns!.forEach(col => {
          obj[col.label] = row[col.key]
        })
        return obj
      })
    : data

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData)
  
  // Auto-size columns if enabled
  if (options?.autoWidth) {
    const maxWidth = 50
    const colWidths: any[] = []
    
    // Calculate column widths
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxLen = 0
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })]
        if (cell && cell.v) {
          const len = String(cell.v).length
          maxLen = Math.max(maxLen, len)
        }
      }
      colWidths.push({ wch: Math.min(maxLen + 2, maxWidth) })
    }
    worksheet['!cols'] = colWidths
  }
  
  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, options?.sheetName || 'Data')
  
  // Download
  XLSX.writeFile(workbook, `${filename}.xlsx`)
  
  */
}

/**
 * Export data ke PDF format (requires jspdf & jspdf-autotable)
 * Install: npm install jspdf jspdf-autotable @types/jspdf-autotable
 * 
 * NOTE: Function ini akan error saat build jika jspdf belum terinstall.
 * Untuk sementara gunakan CSV export.
 */
export const exportToPDF = async (
  data: any[],
  filename: string = 'export',
  options?: {
    title?: string
    columns?: { key: string; label: string }[]
    orientation?: 'portrait' | 'landscape'
    pageSize?: 'a4' | 'letter'
  }
) => {
  throw new Error('PDF export memerlukan library jspdf. Install dengan: npm install jspdf jspdf-autotable\n\nGunakan CSV export untuk saat ini.')
  
  /* UNCOMMENT AFTER INSTALLING jspdf:
  
  if (!data || data.length === 0) {
    throw new Error('Tidak ada data untuk di-export')
  }

  const jsPDF = (await import('jspdf')).default
  const autoTable = (await import('jspdf-autotable')).default
  
  // Create PDF document
  const doc = new jsPDF({
    orientation: options?.orientation || 'landscape',
    unit: 'mm',
    format: options?.pageSize || 'a4'
  })
  
  // Add title
  if (options?.title) {
    doc.setFontSize(16)
    doc.text(options.title, 14, 15)
  }
  
  // Prepare table data
  const headers = options?.columns
    ? options.columns.map(col => col.label)
    : Object.keys(data[0])
  
  const keys = options?.columns
    ? options.columns.map(col => col.key)
    : Object.keys(data[0])
  
  const rows = data.map(row => keys.map(key => row[key] || ''))
  
  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: options?.title ? 25 : 15,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 15, right: 14, bottom: 15, left: 14 }
  })
  
  // Download
  doc.save(`${filename}.pdf`)
  
  */
}

/**
 * Helper: Download blob as file
 */
const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

/**
 * Print current page atau specific element
 */
export const printPage = (elementId?: string) => {
  if (elementId) {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element dengan ID '${elementId}' tidak ditemukan`)
    }
    
    // Open print dialog dengan element specific
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Popup blocker mencegah print window')
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  } else {
    window.print()
  }
}

/**
 * Export component - Ready to use button component
 */
export interface ExportButtonProps {
  data: any[]
  filename?: string
  columns?: { key: string; label: string }[]
  formats?: ('csv' | 'excel' | 'pdf' | 'print')[]
  title?: string
}

/**
 * Format data untuk export (clean up)
 */
export const formatDataForExport = (
  data: any[],
  excludeFields: string[] = ['id', '__typename', 'createdAt', 'updatedAt']
): any[] => {
  return data.map(item => {
    const cleaned: any = {}
    Object.keys(item).forEach(key => {
      if (!excludeFields.includes(key)) {
        cleaned[key] = item[key]
      }
    })
    return cleaned
  })
}

/**
 * Generate filename dengan timestamp
 */
export const generateFilename = (base: string, extension?: string): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const ext = extension ? `.${extension}` : ''
  return `${base}_${timestamp}${ext}`
}

export default {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  printPage,
  formatDataForExport,
  generateFilename
}

