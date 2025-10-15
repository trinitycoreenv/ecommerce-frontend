import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import html2canvas from 'html2canvas'

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable
  }
}

export interface ExportData {
  title: string
  headers: string[]
  rows: (string | number)[][]
  summary?: {
    label: string
    value: string | number
  }[]
  charts?: {
    title: string
    data: any[]
    type: string
  }[]
}

export interface ExportOptions {
  filename: string
  format: 'xlsx' | 'pdf' | 'docx'
  includeCharts?: boolean
  includeSummary?: boolean
}

export class ExportService {
  /**
   * Export data to Excel format (.xlsx)
   */
  static async exportToExcel(data: ExportData, options: ExportOptions): Promise<void> {
    const workbook = XLSX.utils.book_new()
    
    // Main data sheet
    const worksheet = XLSX.utils.aoa_to_sheet([
      [data.title],
      [], // Empty row
      data.headers,
      ...data.rows
    ])
    
    // Set column widths
    const colWidths = data.headers.map(() => ({ wch: 20 }))
    worksheet['!cols'] = colWidths
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
    
    // Summary sheet if provided
    if (data.summary && options.includeSummary) {
      const summarySheet = XLSX.utils.aoa_to_sheet([
        ['Summary'],
        [],
        ['Metric', 'Value'],
        ...data.summary.map(item => [item.label, item.value])
      ])
      summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    }
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${options.filename}.xlsx`)
  }

  /**
   * Export data to PDF format
   */
  static async exportToPDF(data: ExportData, options: ExportOptions): Promise<void> {
    const doc = new jsPDF('l', 'mm', 'a4') // Landscape orientation for better table display
    
    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(data.title, 14, 20)
    
    let yPosition = 35
    
    // Summary section
    if (data.summary && options.includeSummary) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Summary', 14, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      data.summary.forEach((item, index) => {
        doc.text(`${item.label}: ${item.value}`, 20, yPosition)
        yPosition += 7
      })
      
      yPosition += 10
    }
    
    // Data table
    if (data.rows.length > 0) {
      const tableData = data.rows.map(row => 
        row.map(cell => String(cell))
      )
      
      autoTable(doc, {
        head: [data.headers],
        body: tableData,
        startY: yPosition,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 14, right: 14 },
      })
    }
    
    // Add page numbers
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10)
    }
    
    doc.save(`${options.filename}.pdf`)
  }

  /**
   * Export data to Word document format (.docx)
   */
  static async exportToDocx(data: ExportData, options: ExportOptions): Promise<void> {
    try {
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: {
                orientation: 'landscape',
                width: 11906, // A4 landscape in twips
                height: 8420,
              },
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: data.title,
                  bold: true,
                  size: 36,
                  font: 'Arial',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            
            // Summary section
            ...(data.summary && options.includeSummary ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Summary',
                    bold: true,
                    size: 28,
                    font: 'Arial',
                  }),
                ],
                spacing: { before: 400, after: 200 },
              }),
              ...data.summary.map(item => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${item.label}: ${item.value}`,
                      size: 24,
                      font: 'Arial',
                    }),
                  ],
                  spacing: { after: 100 },
                })
              ),
              new Paragraph({
                children: [new TextRun({ text: '', size: 24 })],
                spacing: { after: 200 },
              }),
            ] : []),
            
            // Data table
            ...(data.rows.length > 0 ? [
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                borders: {
                  top: { style: 'single', size: 1, color: '000000' },
                  bottom: { style: 'single', size: 1, color: '000000' },
                  left: { style: 'single', size: 1, color: '000000' },
                  right: { style: 'single', size: 1, color: '000000' },
                  insideHorizontal: { style: 'single', size: 1, color: '000000' },
                  insideVertical: { style: 'single', size: 1, color: '000000' },
                },
                rows: [
                  // Header row
                  new TableRow({
                    children: data.headers.map(header => 
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: header,
                                bold: true,
                                size: 20,
                                font: 'Arial',
                                color: 'FFFFFF',
                              }),
                            ],
                            alignment: AlignmentType.CENTER,
                          }),
                        ],
                        shading: {
                          fill: '2F5496',
                        },
                      })
                    ),
                  }),
                  // Data rows
                  ...data.rows.map((row, index) => 
                    new TableRow({
                      children: row.map(cell => 
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: String(cell),
                                  size: 18,
                                  font: 'Arial',
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: index % 2 === 0 ? { fill: 'F2F2F2' } : { fill: 'FFFFFF' },
                        })
                      ),
                    })
                  ),
                ],
              }),
            ] : []),
          ],
        }],
      })
      
      const buffer = await Packer.toBuffer(doc)
      const blob = new Blob([buffer as unknown as ArrayBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })
      saveAs(blob, `${options.filename}.docx`)
    } catch (error) {
      console.error('DOCX export error:', error)
      throw new Error('Failed to export DOCX file. Please try again.')
    }
  }

  /**
   * Export chart as image (for PDF/DOCX)
   */
  static async exportChartAsImage(chartElement: HTMLElement): Promise<string> {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    })
    return canvas.toDataURL('image/png')
  }

  /**
   * Export to RTF format (more compatible with WordPad and older Word versions)
   */
  static async exportToRTF(data: ExportData, options: ExportOptions): Promise<void> {
    let rtfContent = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}'
    
    // Title
    rtfContent += `\\f0\\fs36\\b ${data.title}\\b0\\fs24\\par\\par`
    
    // Summary section
    if (data.summary && options.includeSummary) {
      rtfContent += '\\b Summary\\b0\\par\\par'
      data.summary.forEach(item => {
        rtfContent += `${item.label}: ${item.value}\\par`
      })
      rtfContent += '\\par'
    }
    
    // Data table
    if (data.rows.length > 0) {
      rtfContent += '\\trowd\\trgaph108\\trleft-108'
      
      // Table headers
      data.headers.forEach(() => {
        rtfContent += '\\cellx2000'
      })
      rtfContent += '\\pard\\intbl\\b'
      data.headers.forEach(header => {
        rtfContent += `${header}\\cell`
      })
      rtfContent += '\\b0\\row'
      
      // Table data
      data.rows.forEach(row => {
        rtfContent += '\\trowd\\trgaph108\\trleft-108'
        data.headers.forEach(() => {
          rtfContent += '\\cellx2000'
        })
        rtfContent += '\\pard\\intbl'
        row.forEach(cell => {
          rtfContent += `${String(cell)}\\cell`
        })
        rtfContent += '\\row'
      })
    }
    
    rtfContent += '}'
    
    const blob = new Blob([rtfContent], { type: 'application/rtf' })
    saveAs(blob, `${options.filename}.rtf`)
  }

  /**
   * Main export function that handles all formats
   */
  static async export(data: ExportData, options: ExportOptions): Promise<void> {
    switch (options.format) {
      case 'xlsx':
        await this.exportToExcel(data, options)
        break
      case 'pdf':
        await this.exportToPDF(data, options)
        break
      case 'docx':
        try {
          await this.exportToDocx(data, options)
        } catch (error) {
          console.warn('DOCX export failed, falling back to RTF:', error)
          await this.exportToRTF(data, options)
        }
        break
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  /**
   * Export multiple reports in a single file
   */
  static async exportMultipleReports(
    reports: { data: ExportData; sheetName: string }[],
    options: Omit<ExportOptions, 'format'> & { format: 'xlsx' | 'pdf' }
  ): Promise<void> {
    if (options.format === 'xlsx') {
      const workbook = XLSX.utils.book_new()
      
      reports.forEach(({ data, sheetName }) => {
        const worksheet = XLSX.utils.aoa_to_sheet([
          [data.title],
          [],
          data.headers,
          ...data.rows
        ])
        
        const colWidths = data.headers.map(() => ({ wch: 20 }))
        worksheet['!cols'] = colWidths
        
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      })
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `${options.filename}.xlsx`)
    } else if (options.format === 'pdf') {
      const doc = new jsPDF('l', 'mm', 'a4')
      
      reports.forEach(({ data }, index) => {
        if (index > 0) {
          doc.addPage()
        }
        
        // Title
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text(data.title, 14, 20)
        
        let yPosition = 35
        
        // Summary section
        if (data.summary && options.includeSummary) {
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text('Summary', 14, yPosition)
          yPosition += 10
          
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          
          data.summary.forEach((item) => {
            doc.text(`${item.label}: ${item.value}`, 20, yPosition)
            yPosition += 7
          })
          
          yPosition += 10
        }
        
        // Data table
        if (data.rows.length > 0) {
          const tableData = data.rows.map(row => 
            row.map(cell => String(cell))
          )
          
          autoTable(doc, {
            head: [data.headers],
            body: tableData,
            startY: yPosition,
            styles: {
              fontSize: 8,
              cellPadding: 3,
            },
            headStyles: {
              fillColor: [41, 128, 185],
              textColor: 255,
              fontStyle: 'bold',
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245],
            },
            margin: { left: 14, right: 14 },
          })
        }
      })
      
      // Add page numbers
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10)
      }
      
      doc.save(`${options.filename}.pdf`)
    }
  }
}

// Utility functions for common data transformations
export const AnalyticsExportUtils = {
  /**
   * Transform revenue data for export
   */
  transformRevenueData(report: any): ExportData {
    return {
      title: 'Revenue Report',
      headers: ['Date', 'Revenue', 'Orders', 'Average Order Value', 'Growth %'],
      rows: report?.sales?.dailySales?.map((item: any) => [
        new Date(item.date).toLocaleDateString(),
        `$${item.revenue.toLocaleString()}`,
        item.orders,
        `$${item.averageOrderValue.toLocaleString()}`,
        `${item.growth?.toFixed(1) || 0}%`
      ]) || [],
      summary: [
        { label: 'Total Revenue', value: `$${report?.revenue?.totalRevenue?.toLocaleString() || 0}` },
        { label: 'Total Orders', value: report?.revenue?.totalOrders || 0 },
        { label: 'Average Order Value', value: `$${report?.revenue?.averageOrderValue?.toLocaleString() || '0'}` },
        { label: 'Revenue Growth', value: `${report?.revenue?.revenueGrowth?.toFixed(1) || 0}%` },
        { label: 'Net Revenue', value: `$${report?.revenue?.netRevenue?.toLocaleString() || 0}` },
        { label: 'Total Commissions', value: `$${report?.revenue?.totalCommissions?.toLocaleString() || 0}` }
      ]
    }
  },

  /**
   * Transform vendor performance data for export
   */
  transformVendorData(report: any): ExportData {
    return {
      title: 'Vendor Performance Report',
      headers: ['Vendor Name', 'Revenue', 'Orders', 'Products', 'Rating', 'Commission'],
      rows: report?.sales?.topVendors?.map((vendor: any) => [
        vendor.vendorName,
        `$${vendor.revenue.toLocaleString()}`,
        vendor.orders,
        vendor.products || 'N/A',
        vendor.rating?.toFixed(1) || 'N/A',
        `$${vendor.commission.toLocaleString()}`
      ]) || [],
      summary: [
        { label: 'Total Vendors', value: report?.vendors?.totalVendors || 0 },
        { label: 'Active Vendors', value: report?.vendors?.activeVendors || 0 },
        { label: 'New Vendors', value: report?.vendors?.newVendors || 0 },
        { label: 'Top Performer', value: report?.vendors?.topPerformingVendors?.[0]?.vendorName || 'N/A' }
      ]
    }
  },

  /**
   * Transform transaction data for export
   */
  transformTransactionData(report: any): ExportData {
    return {
      title: 'Transaction Report',
      headers: ['Transaction ID', 'Date', 'Amount', 'Status', 'Customer', 'Vendor', 'Products'],
      rows: report?.transactions?.map((transaction: any) => [
        transaction.id || 'N/A',
        new Date(transaction.date).toLocaleDateString(),
        `$${transaction.amount.toLocaleString()}`,
        transaction.status,
        transaction.customerName || 'N/A',
        transaction.vendorName || 'N/A',
        transaction.productCount || 0
      ]) || [],
      summary: [
        { label: 'Total Transactions', value: report?.transactions?.length || 0 },
        { label: 'Total Amount', value: `$${report?.transactions?.reduce((sum: number, t: any) => sum + t.amount, 0)?.toLocaleString() || '0'}` },
        { label: 'Average Transaction', value: `$${report?.transactions?.reduce((sum: number, t: any) => sum + t.amount, 0) / (report?.transactions?.length || 1)?.toLocaleString() || '0'}` }
      ]
    }
  },

  /**
   * Transform comprehensive analytics data for export
   */
  transformComprehensiveData(report: any): ExportData {
    return {
      title: 'Comprehensive Analytics Report',
      headers: ['Metric', 'Value', 'Growth', 'Period'],
      rows: [
        ['Total Revenue', `$${report?.revenue?.totalRevenue?.toLocaleString() || 0}`, `${report?.revenue?.revenueGrowth?.toFixed(1) || 0}%`, 'Current'],
        ['Total Orders', report?.revenue?.totalOrders || 0, 'N/A', 'Current'],
        ['Total Customers', report?.customers?.totalCustomers || 0, `${report?.customers?.newCustomers || 0} new`, 'Current'],
        ['Active Vendors', report?.vendors?.activeVendors || 0, `${report?.vendors?.newVendors || 0} new`, 'Current'],
        ['Total Products', report?.platform?.totalProducts || 0, 'N/A', 'Current'],
        ['Average Order Value', `$${report?.revenue?.averageOrderValue?.toLocaleString() || '0'}`, 'N/A', 'Current'],
        ['Net Revenue', `$${report?.revenue?.netRevenue?.toLocaleString() || 0}`, 'N/A', 'Current'],
        ['Total Commissions', `$${report?.revenue?.totalCommissions?.toLocaleString() || 0}`, 'N/A', 'Current']
      ],
      summary: [
        { label: 'Report Period', value: `${report?.period?.startDate ? new Date(report.period.startDate).toLocaleDateString() : 'N/A'} - ${report?.period?.endDate ? new Date(report.period.endDate).toLocaleDateString() : 'N/A'}` },
        { label: 'Report Type', value: report?.period?.type || 'N/A' },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform commission data for export
   */
  transformCommissionData(commissions: any[], stats: any): ExportData {
    return {
      title: 'Commission Management Report',
      headers: ['Order ID', 'Vendor', 'Order Total', 'Commission Rate', 'Commission Amount', 'Status', 'Calculated Date', 'Paid Date'],
      rows: commissions.map(commission => [
        commission.order?.orderNumber || 'N/A',
        commission.vendor?.businessName || 'N/A',
        `$${commission.order?.totalPrice?.toLocaleString() || '0'}`,
        `${commission.rate}%`,
        `$${commission.amount?.toLocaleString() || '0'}`,
        commission.status,
        new Date(commission.calculatedAt).toLocaleDateString(),
        commission.paidAt ? new Date(commission.paidAt).toLocaleDateString() : 'Not Paid'
      ]),
      summary: [
        { label: 'Total Commissions', value: `$${stats?.totalCommissions?.toLocaleString() || '0'}` },
        { label: 'Total Count', value: stats?.totalCount || 0 },
        { label: 'Pending', value: `${stats?.PENDING?.count || 0} ($${stats?.PENDING?.total?.toLocaleString() || '0'})` },
        { label: 'Calculated', value: `${stats?.CALCULATED?.count || 0} ($${stats?.CALCULATED?.total?.toLocaleString() || '0'})` },
        { label: 'Paid', value: `${stats?.PAID?.count || 0} ($${stats?.PAID?.total?.toLocaleString() || '0'})` },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform payout data for export
   */
  transformPayoutData(payouts: any[], stats: any): ExportData {
    return {
      title: 'Payout Management Report',
      headers: ['Payout ID', 'Vendor', 'Amount', 'Status', 'Scheduled Date', 'Processed Date', 'Payment Method', 'Retry Count', 'Failure Reason'],
      rows: payouts.map(payout => [
        `#${payout.id.slice(-8)}`,
        payout.vendor?.businessName || 'N/A',
        `$${payout.amount?.toLocaleString() || '0'}`,
        payout.status,
        new Date(payout.scheduledDate).toLocaleDateString(),
        payout.processedAt ? new Date(payout.processedAt).toLocaleDateString() : 'Not Processed',
        payout.paymentMethod || 'N/A',
        payout.retryCount || 0,
        payout.failureReason || 'N/A'
      ]),
      summary: [
        { label: 'Total Processed', value: `$${((stats?.COMPLETED?.total || 0) + (stats?.PROCESSING?.total || 0) + (stats?.PENDING?.total || 0)).toLocaleString()}` },
        { label: 'Pending', value: `${stats?.PENDING?.count || 0} ($${stats?.PENDING?.total?.toLocaleString() || '0'})` },
        { label: 'Processing', value: `${stats?.PROCESSING?.count || 0} ($${stats?.PROCESSING?.total?.toLocaleString() || '0'})` },
        { label: 'Completed', value: `${stats?.COMPLETED?.count || 0} ($${stats?.COMPLETED?.total?.toLocaleString() || '0'})` },
        { label: 'Failed', value: `${stats?.FAILED?.count || 0} ($${stats?.FAILED?.total?.toLocaleString() || '0'})` },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform inventory data for export
   */
  transformInventoryData(report: any, alerts: any[]): ExportData {
    return {
      title: 'Inventory Management Report',
      headers: ['Product Name', 'Category', 'Current Stock', 'Total Value', 'Status', 'Vendor', 'Days in Stock'],
      rows: [
        // Top selling products
        ...(report?.topSellingProducts?.map((product: any) => [
          product.productName,
          'Top Selling',
          'N/A',
          `$${product.revenue?.toLocaleString() || '0'}`,
          'Active',
          'N/A',
          'N/A'
        ]) || []),
        // Slow moving products
        ...(report?.slowMovingProducts?.map((product: any) => [
          product.productName,
          'Slow Moving',
          product.currentStock,
          'N/A',
          'Active',
          'N/A',
          product.daysInStock
        ]) || []),
        // Stock alerts
        ...(alerts?.map((alert: any) => [
          alert.productName,
          'Alert',
          alert.currentStock,
          'N/A',
          alert.alertType,
          alert.vendorName,
          'N/A'
        ]) || [])
      ],
      summary: [
        { label: 'Total Products', value: report?.totalProducts || 0 },
        { label: 'Total Value', value: `$${report?.totalValue?.toLocaleString() || '0'}` },
        { label: 'Low Stock Products', value: report?.lowStockProducts || 0 },
        { label: 'Out of Stock Products', value: report?.outOfStockProducts || 0 },
        { label: 'Reorder Needed', value: report?.reorderNeeded || 0 },
        { label: 'Active Alerts', value: alerts?.length || 0 },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform admin dashboard data for export
   */
  transformAdminDashboardData(dashboardData: any): ExportData {
    return {
      title: 'Admin Dashboard Report',
      headers: ['Metric', 'Value', 'Description', 'Status'],
      rows: [
        ['Total Revenue', `$${dashboardData?.totalRevenue?.toLocaleString() || '0'}/month`, 'Monthly recurring revenue', 'Active'],
        ['Active Vendors', dashboardData?.activeVendors || 0, 'Verified vendors on platform', 'Active'],
        ['Pending Approvals', dashboardData?.pendingApprovals || 0, 'Items requiring review', dashboardData?.pendingApprovals > 0 ? 'Pending' : 'Complete'],
        ['Active Shipments', dashboardData?.activeShipments || 0, 'Orders in transit', 'Active'],
        ['MRR', `$${dashboardData?.mrr?.toLocaleString() || '0'}`, 'Monthly recurring revenue', 'Active'],
        ['ARR', `$${dashboardData?.arr?.toLocaleString() || '0'}`, 'Annual recurring revenue', 'Active'],
        ['Total Subscriptions', dashboardData?.summary?.totalSubscriptions || 0, 'All subscription plans', 'Active'],
        ['Active Subscriptions', dashboardData?.summary?.activeSubscriptions || 0, 'Currently active subscriptions', 'Active']
      ],
      summary: [
        { label: 'Report Type', value: 'Admin Dashboard Overview' },
        { label: 'Platform Status', value: 'Operational' },
        { label: 'Total Vendors', value: dashboardData?.summary?.totalVendors || 0 },
        { label: 'Active Vendors', value: dashboardData?.summary?.activeVendors || 0 },
        { label: 'Monthly Revenue', value: `$${dashboardData?.summary?.monthlyRevenue?.toLocaleString() || '0'}` },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform subscription data for export
   */
  transformSubscriptionData(subscriptions: any[], stats: any): ExportData {
    return {
      title: 'Vendor Subscriptions Report',
      headers: ['Vendor', 'Plan', 'Tier', 'Price', 'Status', 'Created Date', 'Contact Email'],
      rows: subscriptions.map(subscription => [
        subscription.vendor?.businessName || 'N/A',
        subscription.plan?.name || 'N/A',
        subscription.tier || 'N/A',
        `₱${subscription.price?.toLocaleString() || '0'}/month`,
        subscription.status,
        new Date(subscription.createdAt).toLocaleDateString(),
        subscription.vendor?.user?.email || 'N/A'
      ]),
      summary: [
        { label: 'Total Subscriptions', value: stats?.subscriptions?.ACTIVE || 0 },
        { label: 'Active Subscriptions', value: stats?.subscriptions?.ACTIVE || 0 },
        { label: 'Inactive Subscriptions', value: stats?.subscriptions?.INACTIVE || 0 },
        { label: 'Monthly Revenue', value: `₱${stats?.totalRevenue?.toLocaleString() || '0'}` },
        { label: 'Average Subscription Value', value: `₱${stats?.totalRevenue ? (stats.totalRevenue / (stats.subscriptions?.ACTIVE || 1)).toLocaleString() : '0'}` },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform product management data for export
   */
  transformProductManagementData(products: any[], stats: any): ExportData {
    return {
      title: 'Product Management Report',
      headers: ['Product Name', 'Category', 'SKU', 'Price', 'Stock', 'Status', 'Created Date'],
      rows: products.map(product => [
        product.name,
        product.category?.name || 'N/A',
        product.sku || 'N/A',
        `$${product.price?.toLocaleString() || '0'}`,
        product.inventory || 0,
        product.status,
        new Date(product.createdAt).toLocaleDateString()
      ]),
      summary: [
        { label: 'Total Products', value: products.length },
        { label: 'Active Products', value: products.filter(p => p.status === 'APPROVED').length },
        { label: 'Pending Approval', value: products.filter(p => p.status === 'PENDING_APPROVAL').length },
        { label: 'Low Stock Products', value: products.filter(p => Number(p.inventory) < 10).length },
        { label: 'Total Product Value', value: `$${products.reduce((sum, p) => sum + (Number(p.price) * Number(p.inventory)), 0).toLocaleString()}` },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform shipping data for export
   */
  transformShippingData(shipments: any[], stats: any): ExportData {
    return {
      title: 'Shipping Management Report',
      headers: ['Tracking Number', 'Order ID', 'Customer', 'Carrier', 'Status', 'Shipping Cost', 'Created Date'],
      rows: shipments.map(shipment => [
        shipment.trackingNumber,
        shipment.orderId,
        shipment.order?.customer?.name || 'N/A',
        shipment.carrier,
        shipment.status,
        `₱${shipment.shippingCost?.toFixed(2) || '0.00'}`,
        new Date(shipment.createdAt).toLocaleDateString()
      ]),
      summary: [
        { label: 'Total Shipments', value: stats?.totalShipments || 0 },
        { label: 'Delivered', value: stats?.deliveredShipments || 0 },
        { label: 'In Transit', value: stats?.inTransitShipments || 0 },
        { label: 'Average Delivery Time', value: `${stats?.averageDeliveryTime || 0} days` },
        { label: 'Total Shipping Cost', value: `₱${stats?.totalShippingCost?.toFixed(2) || '0.00'}` },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform order data for export
   */
  transformOrderData(orders: any[], stats: any): ExportData {
    return {
      title: 'Order Management Report',
      headers: ['Order Number', 'Customer', 'Total Price', 'Status', 'Items Count', 'Order Date', 'Customer Email'],
      rows: orders.map(order => [
        order.orderNumber,
        order.customer?.name || 'N/A',
        `₱${order.totalPrice?.toLocaleString() || '0'}`,
        order.status,
        order.items?.length || 0,
        new Date(order.createdAt).toLocaleDateString(),
        order.customer?.email || 'N/A'
      ]),
      summary: [
        { label: 'Total Orders', value: orders.length },
        { label: 'Pending Orders', value: orders.filter(o => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status)).length },
        { label: 'In Transit', value: orders.filter(o => o.status === 'SHIPPED').length },
        { label: 'Delivered', value: orders.filter(o => o.status === 'DELIVERED').length },
        { label: 'Total Revenue', value: `₱${orders.reduce((sum, o) => sum + Number(o.totalPrice), 0).toLocaleString()}` },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform vendor payout data for export
   */
  transformVendorPayoutData(payouts: any[], walletData: any, settings: any): ExportData {
    return {
      title: 'Vendor Payout Report',
      headers: ['Payout ID', 'Status', 'Amount', 'Scheduled Date', 'Processed Date', 'Payment Method', 'Notes'],
      rows: payouts.map(payout => [
        `#${payout.id.slice(-8)}`,
        payout.status,
        `$${payout.amount?.toLocaleString() || '0'}`,
        new Date(payout.scheduledDate).toLocaleDateString(),
        payout.processedAt ? new Date(payout.processedAt).toLocaleDateString() : 'Not Processed',
        payout.paymentMethod || 'N/A',
        payout.notes || 'N/A'
      ]),
      summary: [
        { label: 'Wallet Balance', value: `$${walletData?.availableBalance?.toLocaleString() || '0'}` },
        { label: 'Total Earned', value: `$${walletData?.totalEarnings?.toLocaleString() || '0'}` },
        { label: 'Total Paid Out', value: `$${walletData?.totalPaidOut?.toLocaleString() || '0'}` },
        { label: 'Payout Frequency', value: settings?.payoutFrequency || 'N/A' },
        { label: 'Minimum Payout', value: `$${settings?.minimumPayout?.toLocaleString() || '0'}` },
        { label: 'Payment Method', value: settings?.payoutMethod || 'N/A' },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform vendor inventory data for export
   */
  transformVendorInventoryData(products: any[], alerts: any[], stats: any): ExportData {
    return {
      title: 'Vendor Inventory Report',
      headers: ['Product Name', 'Category', 'Current Stock', 'Low Stock Threshold', 'Reorder Point', 'Stock Status', 'Vendor'],
      rows: products.map(product => [
        product.productName,
        product.category?.name || 'Uncategorized',
        product.currentStock,
        product.lowStockThreshold,
        product.reorderPoint,
        product.isOutOfStock ? 'Out of Stock' : product.isLowStock ? 'Low Stock' : product.needsReorder ? 'Reorder Needed' : 'In Stock',
        product.vendor?.businessName || 'N/A'
      ]),
      summary: [
        { label: 'Total Products', value: stats.totalProducts },
        { label: 'Low Stock Products', value: stats.lowStockProducts },
        { label: 'Out of Stock Products', value: stats.outOfStockProducts },
        { label: 'Active Alerts', value: alerts.length },
        { label: 'Total Inventory Value', value: `$${stats.totalValue?.toLocaleString() || '0'}` },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform vendor analytics data for export
   */
  transformVendorAnalyticsData(analytics: any): ExportData {
    return {
      title: 'Vendor Analytics Report',
      headers: ['Metric', 'Value', 'Details'],
      rows: [
        ['Total Revenue', `$${analytics?.revenue?.totalRevenue?.toLocaleString() || '0'}`, 'Gross revenue before fees'],
        ['Net Revenue', `$${analytics?.revenue?.netRevenue?.toLocaleString() || '0'}`, 'Revenue after platform fees'],
        ['Total Orders', analytics?.revenue?.totalOrders || 0, 'Total number of orders'],
        ['Average Order Value', `$${analytics?.revenue?.averageOrderValue?.toFixed(2) || '0.00'}`, 'Average value per order'],
        ['Revenue Growth', `${analytics?.revenue?.revenueGrowth?.toFixed(1) || '0'}%`, 'Growth vs previous period'],
        ['Total Customers', analytics?.customers?.totalCustomers || 0, 'Total unique customers'],
        ['New Customers', analytics?.customers?.newCustomers || 0, 'New customers this period'],
        ['Returning Customers', analytics?.customers?.returningCustomers || 0, 'Returning customers'],
        ['Average Customer Value', `$${analytics?.customers?.averageCustomerValue?.toFixed(2) || '0.00'}`, 'Average value per customer'],
        ['Total Products', analytics?.products?.totalProducts || 0, 'Total products in catalog'],
        ['Active Products', analytics?.products?.activeProducts || 0, 'Currently active products'],
        ['Low Stock Products', analytics?.products?.lowStockProducts || 0, 'Products needing restocking'],
        ['Out of Stock Products', analytics?.products?.outOfStockProducts || 0, 'Products with zero inventory'],
        ['Conversion Rate', `${analytics?.performance?.conversionRate?.toFixed(1) || '0'}%`, 'Visitor to customer conversion'],
        ['Average Rating', `${analytics?.performance?.averageRating?.toFixed(1) || '0'}/5.0`, 'Average product rating'],
        ['Total Reviews', analytics?.performance?.totalReviews || 0, 'Total customer reviews'],
        ['Response Time', `${analytics?.performance?.responseTime?.toFixed(1) || '0'} hours`, 'Average response time']
      ],
      summary: [
        { label: 'Report Period', value: 'Current Period' },
        { label: 'Top Product', value: analytics?.sales?.topProducts?.[0]?.productName || 'N/A' },
        { label: 'Best Selling Product Revenue', value: `$${analytics?.sales?.topProducts?.[0]?.revenue?.toLocaleString() || '0'}` },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform finance dashboard data for export
   */
  transformFinanceDashboardData(financeData: any): ExportData {
    return {
      title: 'Finance Dashboard Report',
      headers: ['Metric', 'Value', 'Details'],
      rows: [
        ['Total Platform Revenue', `₱${financeData?.totalPlatformRevenue?.toLocaleString() || '0'}`, 'Total platform revenue'],
        ['Monthly Recurring Revenue', `₱${financeData?.subscriptionRevenue?.mrr?.toLocaleString() || '0'}`, 'MRR from subscriptions'],
        ['Annual Recurring Revenue', `₱${financeData?.subscriptionRevenue?.arr?.toLocaleString() || '0'}`, 'ARR from subscriptions'],
        ['Active Subscriptions', financeData?.subscriptionRevenue?.activeSubscriptions || 0, 'Currently active subscriptions'],
        ['Transaction Commissions', `₱${financeData?.transactionRevenue?.commissions?.toLocaleString() || '0'}`, 'Commission from transactions'],
        ['Total Orders', financeData?.transactionRevenue?.orders || 0, 'Total transaction orders'],
        ['Pending Payouts', `₱${financeData?.pendingPayoutsSummary?.total?.toLocaleString() || '0'}`, 'Total pending payouts'],
        ['Pending Payout Count', financeData?.pendingPayoutsSummary?.count || 0, 'Number of pending payouts']
      ],
      summary: [
        { label: 'Report Period', value: 'Current Period' },
        { label: 'Subscription Tiers', value: Object.keys(financeData?.subscriptionStats?.byTier || {}).join(', ') || 'N/A' },
        { label: 'Recent Subscriptions', value: financeData?.recentSubscriptions?.length || 0 },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform finance transactions data for export
   */
  transformFinanceTransactionsData(transactionData: any): ExportData {
    return {
      title: 'Finance Transactions Report',
      headers: ['Transaction ID', 'Vendor', 'Amount', 'Commission', 'Net to Vendor', 'Status', 'Date'],
      rows: transactionData.transactions?.map((transaction: any) => [
        transaction.id || 'N/A',
        transaction.vendor || 'N/A',
        `₱${transaction.amount?.toLocaleString() || '0'}`,
        `₱${transaction.commission?.toLocaleString() || '0'}`,
        `₱${transaction.netAmount?.toLocaleString() || '0'}`,
        transaction.status || 'N/A',
        transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'
      ]) || [],
      summary: [
        { label: 'Total Transactions', value: transactionData.totalTransactions || 0 },
        { label: 'Gross Revenue', value: `₱${transactionData.grossRevenue?.toLocaleString() || '0'}` },
        { label: 'Platform Commission', value: `₱${transactionData.platformCommission?.toLocaleString() || '0'}` },
        { label: 'Net to Vendors', value: `₱${transactionData.netToVendors?.toLocaleString() || '0'}` },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform finance commissions data for export
   */
  transformFinanceCommissionsData(commissionData: any): ExportData {
    return {
      title: 'Finance Commissions Report',
      headers: ['Vendor', 'Commission Amount', 'Rate', 'Order Total', 'Order Count', 'Status', 'Date'],
      rows: commissionData.commissions?.map((commission: any) => [
        commission.vendor || 'N/A',
        `₱${commission.amount?.toLocaleString() || '0'}`,
        `${(commission.rate * 100)?.toFixed(1) || '0'}%`,
        `₱${commission.orderTotal?.toLocaleString() || '0'}`,
        commission.orderCount || 0,
        commission.status || 'N/A',
        commission.createdAt ? new Date(commission.createdAt).toLocaleDateString() : 'N/A'
      ]) || [],
      summary: [
        { label: 'Total Commission', value: `₱${commissionData.totalCommission?.toLocaleString() || '0'}` },
        { label: 'Gross Revenue', value: `₱${commissionData.grossRevenue?.toLocaleString() || '0'}` },
        { label: 'Average Rate', value: `${commissionData.averageRate?.toFixed(1) || '0'}%` },
        { label: 'Active Vendors', value: commissionData.activeVendors || 0 },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  },

  /**
   * Transform finance payouts data for export
   */
  transformFinancePayoutsData(payoutData: any): ExportData {
    return {
      title: 'Finance Payouts Report',
      headers: ['Payout ID', 'Vendor', 'Amount', 'Status', 'Scheduled Date', 'Processed Date', 'Payment Method'],
      rows: payoutData.payouts?.map((payout: any) => [
        payout.id || 'N/A',
        payout.vendor || 'N/A',
        `₱${payout.amount?.toLocaleString() || '0'}`,
        payout.status || 'N/A',
        payout.scheduledDate ? new Date(payout.scheduledDate).toLocaleDateString() : 'N/A',
        payout.processedDate ? new Date(payout.processedDate).toLocaleDateString() : 'Not Processed',
        payout.paymentMethod || 'N/A'
      ]) || [],
      summary: [
        { label: 'Upcoming Payouts', value: `₱${payoutData.upcomingPayouts?.toLocaleString() || '0'}` },
        { label: 'This Month Paid', value: `₱${payoutData.thisMonthPaid?.toLocaleString() || '0'}` },
        { label: 'Next Payout Date', value: payoutData.nextPayoutDate ? new Date(payoutData.nextPayoutDate).toLocaleDateString() : 'N/A' },
        { label: 'Total This Year', value: `₱${payoutData.totalThisYear?.toLocaleString() || '0'}` },
        { label: 'Generated On', value: new Date().toLocaleString() }
      ]
    }
  }
}
