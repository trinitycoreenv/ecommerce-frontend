'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, FileType } from 'lucide-react'
import { ExportService, ExportData, ExportOptions } from '@/lib/export-service'

interface ExportDropdownProps {
  data: ExportData
  filename: string
  disabled?: boolean
  className?: string
}

export function ExportDropdown({ data, filename, disabled = false, className }: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'xlsx' | 'pdf' | 'docx') => {
    setIsExporting(true)
    try {
      const options: ExportOptions = {
        filename,
        format,
        includeCharts: false,
        includeSummary: true
      }
      
      await ExportService.export(data, options)
    } catch (error) {
      console.error('Export failed:', error)
      // You could add a toast notification here
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled || isExporting}
          className={className}
        >
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
          Export Format
        </div>
        <DropdownMenuItem onClick={() => handleExport('xlsx')} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          <div className="flex flex-col">
            <span>Excel Spreadsheet</span>
            <span className="text-xs text-muted-foreground">.xlsx format</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2 text-red-600" />
          <div className="flex flex-col">
            <span>PDF Document</span>
            <span className="text-xs text-muted-foreground">.pdf format</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('docx')} className="cursor-pointer">
          <FileType className="h-4 w-4 mr-2 text-blue-600" />
          <div className="flex flex-col">
            <span>Word Document</span>
            <span className="text-xs text-muted-foreground">.docx format</span>
            <span className="text-xs text-orange-600">Use Word, not WordPad</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface QuickExportButtonProps {
  data: ExportData
  filename: string
  format: 'xlsx' | 'pdf' | 'docx'
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export function QuickExportButton({ 
  data, 
  filename, 
  format, 
  disabled = false, 
  className,
  children 
}: QuickExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const options: ExportOptions = {
        filename,
        format,
        includeCharts: false,
        includeSummary: true
      }
      
      await ExportService.export(data, options)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const getIcon = () => {
    switch (format) {
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4" />
      case 'pdf':
        return <FileText className="h-4 w-4" />
      case 'docx':
        return <FileType className="h-4 w-4" />
      default:
        return <Download className="h-4 w-4" />
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      disabled={disabled || isExporting}
      onClick={handleExport}
      className={className}
      title={`Export as ${format.toUpperCase()}`}
    >
      {children || getIcon()}
    </Button>
  )
}
