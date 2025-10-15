'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExportDropdown } from '@/components/shared/export-dropdown'
import { ExportService, AnalyticsExportUtils } from '@/lib/export-service'

// Sample data for testing
const sampleReport = {
  period: {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    type: 'monthly'
  },
  revenue: {
    totalRevenue: 10873.73,
    totalCommissions: 1087.37,
    netRevenue: 9786.36,
    averageOrderValue: 1812.29,
    totalOrders: 6,
    revenueGrowth: 15.5,
    commissionRate: 10.0
  },
  sales: {
    dailySales: [
      { date: '2024-01-01', revenue: 1200, orders: 1, averageOrderValue: 1200, growth: 0 },
      { date: '2024-01-02', revenue: 1800, orders: 2, averageOrderValue: 900, growth: 50 },
      { date: '2024-01-03', revenue: 2100, orders: 1, averageOrderValue: 2100, growth: 16.7 },
      { date: '2024-01-04', revenue: 1500, orders: 1, averageOrderValue: 1500, growth: -28.6 },
      { date: '2024-01-05', revenue: 2273.73, orders: 1, averageOrderValue: 2273.73, growth: 51.6 }
    ],
    topVendors: [
      { vendorId: '1', vendorName: 'TechStore Pro', revenue: 6500, orders: 3, commission: 650 },
      { vendorId: '2', vendorName: 'Electronics Plus', revenue: 4373.73, orders: 3, commission: 437.37 }
    ]
  },
  customers: {
    totalCustomers: 1,
    newCustomers: 1,
    returningCustomers: 0,
    customerRetentionRate: 0,
    averageCustomerValue: 10873.73,
    customerLifetimeValue: 10873.73
  },
  vendors: {
    totalVendors: 2,
    activeVendors: 2,
    newVendors: 2,
    topPerformingVendors: [
      { vendorId: '1', vendorName: 'TechStore Pro', revenue: 6500, orders: 3, products: 5, rating: 4.8 }
    ]
  },
  transactions: [
    { id: 'TXN001', date: '2024-01-01', amount: 1200, status: 'completed', customerName: 'John Doe', vendorName: 'TechStore Pro', productCount: 2 },
    { id: 'TXN002', date: '2024-01-02', amount: 1800, status: 'completed', customerName: 'Jane Smith', vendorName: 'Electronics Plus', productCount: 3 },
    { id: 'TXN003', date: '2024-01-03', amount: 2100, status: 'completed', customerName: 'Bob Johnson', vendorName: 'TechStore Pro', productCount: 1 },
    { id: 'TXN004', date: '2024-01-04', amount: 1500, status: 'completed', customerName: 'Alice Brown', vendorName: 'Electronics Plus', productCount: 2 },
    { id: 'TXN005', date: '2024-01-05', amount: 2273.73, status: 'completed', customerName: 'Charlie Wilson', vendorName: 'TechStore Pro', productCount: 4 }
  ]
}

// Sample commission data
const sampleCommissions = [
  {
    id: '1',
    order: { orderNumber: 'ORD-001', totalPrice: 1200 },
    vendor: { businessName: 'TechStore Pro' },
    rate: 8.5,
    amount: 102,
    status: 'PAID',
    calculatedAt: '2024-01-01',
    paidAt: '2024-01-02'
  },
  {
    id: '2',
    order: { orderNumber: 'ORD-002', totalPrice: 800 },
    vendor: { businessName: 'Electronics Plus' },
    rate: 10.0,
    amount: 80,
    status: 'CALCULATED',
    calculatedAt: '2024-01-02'
  },
  {
    id: '3',
    order: { orderNumber: 'ORD-003', totalPrice: 1500 },
    vendor: { businessName: 'TechStore Pro' },
    rate: 8.5,
    amount: 127.5,
    status: 'PENDING',
    calculatedAt: '2024-01-03'
  }
]

const sampleCommissionStats = {
  totalCommissions: 309.5,
  totalCount: 3,
  PENDING: { count: 1, total: 127.5 },
  CALCULATED: { count: 1, total: 80 },
  PAID: { count: 1, total: 102 }
}

// Sample payout data
const samplePayouts = [
  {
    id: 'payout-001',
    vendor: { businessName: 'TechStore Pro' },
    amount: 229.5,
    status: 'COMPLETED',
    scheduledDate: '2024-01-01',
    processedAt: '2024-01-01',
    paymentMethod: 'Bank Transfer',
    retryCount: 0,
    failureReason: null
  },
  {
    id: 'payout-002',
    vendor: { businessName: 'Electronics Plus' },
    amount: 80,
    status: 'PENDING',
    scheduledDate: '2024-01-05',
    paymentMethod: 'PayPal',
    retryCount: 0,
    failureReason: null
  },
  {
    id: 'payout-003',
    vendor: { businessName: 'TechStore Pro' },
    amount: 127.5,
    status: 'PROCESSING',
    scheduledDate: '2024-01-10',
    paymentMethod: 'Bank Transfer',
    retryCount: 1,
    failureReason: null
  }
]

const samplePayoutStats = {
  PENDING: { count: 1, total: 80 },
  PROCESSING: { count: 1, total: 127.5 },
  COMPLETED: { count: 1, total: 229.5 },
  FAILED: { count: 0, total: 0 }
}

// Sample inventory data
const sampleInventoryReport = {
  totalProducts: 2,
  totalValue: 6698.86,
  lowStockProducts: 0,
  outOfStockProducts: 0,
  reorderNeeded: 0,
  topSellingProducts: [
    {
      productId: '1',
      productName: 'Wireless Bluetooth Headphones',
      quantitySold: 26,
      revenue: 7799.74
    },
    {
      productId: '2',
      productName: 'Premium Cotton T-Shirt',
      quantitySold: 0,
      revenue: 0
    }
  ],
  slowMovingProducts: [
    {
      productId: '2',
      productName: 'Premium Cotton T-Shirt',
      currentStock: 50,
      daysInStock: 30
    }
  ],
  categoryBreakdown: [
    {
      categoryId: '1',
      categoryName: 'Fashion & Apparel',
      productCount: 1,
      totalValue: 2499
    },
    {
      categoryId: '2',
      categoryName: 'Electronics & Gadgets',
      productCount: 1,
      totalValue: 4199.86
    }
  ]
}

const sampleStockAlerts = [
  {
    id: '1',
    productId: '1',
    productName: 'Wireless Bluetooth Headphones',
    currentStock: 5,
    threshold: 10,
    alertType: 'LOW_STOCK',
    severity: 'MEDIUM',
    vendorId: '1',
    vendorName: 'TechStore Pro',
    isActive: true
  }
]

// Sample admin dashboard data
const sampleDashboardData = {
  totalRevenue: 20424,
  activeVendors: 2,
  pendingApprovals: 0,
  activeShipments: 0,
  mrr: 20000,
  arr: 240000,
  subscriptionStats: {
    ACTIVE: { count: 2, revenue: 20000 },
    INACTIVE: { count: 0, revenue: 0 }
  },
  vendorStats: {
    ACTIVE: 2,
    PENDING: 0,
    INACTIVE: 0
  },
  recentSubscriptions: [
    {
      id: '1',
      vendor: { businessName: 'Jay' },
      plan: { name: 'Enterprise Plan' },
      tier: 'ENTERPRISE',
      price: 10000,
      status: 'ACTIVE',
      createdAt: '2024-10-13'
    }
  ],
  recentVendors: [
    {
      id: '1',
      businessName: 'TechStore Pro',
      user: { name: 'John Doe', email: 'john@techstore.com' },
      status: 'ACTIVE',
      createdAt: '2024-10-01'
    }
  ],
  summary: {
    totalSubscriptions: 2,
    totalVendors: 2,
    activeSubscriptions: 2,
    activeVendors: 2,
    monthlyRevenue: 20424
  }
}

// Sample product data
const sampleProducts = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    category: { name: 'Electronics & Gadgets' },
    sku: 'WBH-001',
    price: 299.99,
    inventory: 14,
    status: 'APPROVED',
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Premium Cotton T-Shirt',
    category: { name: 'Fashion & Apparel' },
    sku: 'PCT-001',
    price: 24.99,
    inventory: 100,
    status: 'APPROVED',
    createdAt: '2024-01-02'
  },
  {
    id: '3',
    name: 'Smart Watch',
    category: { name: 'Electronics & Gadgets' },
    sku: 'SW-001',
    price: 199.99,
    inventory: 5,
    status: 'PENDING_APPROVAL',
    createdAt: '2024-01-03'
  }
]

const sampleProductStats = {
  totalProducts: 3,
  activeProducts: 2,
  pendingProducts: 1,
  lowStockProducts: 2
}

// Sample shipping data
const sampleShipments = [
  {
    id: '1',
    trackingNumber: '1Z999AA1234567890',
    orderId: 'ORD-001',
    order: { customer: { name: 'John Doe' } },
    carrier: 'UPS',
    status: 'DELIVERED',
    shippingCost: 12.99,
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    trackingNumber: '1Z999BB2345678901',
    orderId: 'ORD-002',
    order: { customer: { name: 'Jane Smith' } },
    carrier: 'FedEx',
    status: 'IN_TRANSIT',
    shippingCost: 15.99,
    createdAt: '2024-01-02'
  }
]

const sampleShippingStats = {
  totalShipments: 2,
  deliveredShipments: 1,
  inTransitShipments: 1,
  averageDeliveryTime: 3,
  totalShippingCost: 28.98
}

// Sample order data
const sampleOrders = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customer: { name: 'John Doe', email: 'john@example.com' },
    totalPrice: 312.98,
    status: 'DELIVERED',
    items: [{ id: '1' }, { id: '2' }],
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    customer: { name: 'Jane Smith', email: 'jane@example.com' },
    totalPrice: 215.98,
    status: 'IN_TRANSIT',
    items: [{ id: '3' }],
    createdAt: '2024-01-02'
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    customer: { name: 'Bob Johnson', email: 'bob@example.com' },
    totalPrice: 24.99,
    status: 'PENDING',
    items: [{ id: '4' }],
    createdAt: '2024-01-03'
  }
]

const sampleOrderStats = {
  totalOrders: 3,
  pendingOrders: 1,
  inTransit: 1,
  delivered: 1
}


const sampleWalletData = {
  availableBalance: 850.00,
  totalEarnings: 12500.00,
  totalPaidOut: 11650.00,
  pendingPayouts: 850.00
}

const samplePayoutSettings = {
  payoutFrequency: 'MONTHLY',
  minimumPayout: 50.00,
  payoutMethod: 'STRIPE',
  isActive: true
}

const sampleVendorInventory = [
  {
    productId: 'prod_001',
    productName: 'Premium Cotton T-Shirt',
    currentStock: 100,
    lowStockThreshold: 20,
    reorderPoint: 10,
    isLowStock: false,
    isOutOfStock: false,
    needsReorder: false,
    category: { name: 'Fashion & Apparel' },
    vendor: { businessName: 'Fashion Store' }
  },
  {
    productId: 'prod_002',
    productName: 'Wireless Bluetooth Headphones',
    currentStock: 14,
    lowStockThreshold: 15,
    reorderPoint: 5,
    isLowStock: true,
    isOutOfStock: false,
    needsReorder: false,
    category: { name: 'Electronics & Gadgets' },
    vendor: { businessName: 'Tech Store' }
  }
]

const sampleVendorInventoryAlerts = [
  {
    id: 'alert_001',
    productId: 'prod_002',
    productName: 'Wireless Bluetooth Headphones',
    currentStock: 14,
    threshold: 15,
    alertType: 'LOW_STOCK',
    severity: 'MEDIUM'
  }
]

const sampleVendorAnalytics = {
  revenue: {
    totalRevenue: 20413.63,
    totalCommissions: 424.00,
    netRevenue: 19989.63,
    averageOrderValue: 1360.91,
    totalOrders: 15,
    revenueGrowth: 0.0
  },
  customers: {
    totalCustomers: 2,
    newCustomers: 2,
    returningCustomers: 0,
    averageCustomerValue: 10206.82
  },
  products: {
    totalProducts: 2,
    activeProducts: 2,
    lowStockProducts: 1,
    outOfStockProducts: 0,
    topSellingProducts: [
      {
        productId: 'prod_002',
        productName: 'Wireless Bluetooth Headphones',
        quantitySold: 36,
        revenue: 10799.64
      }
    ]
  },
  performance: {
    conversionRate: 0.0,
    averageRating: 0.0,
    totalReviews: 0,
    responseTime: 0.0
  },
  sales: {
    topProducts: [
      {
        productId: 'prod_002',
        productName: 'Wireless Bluetooth Headphones',
        revenue: 10799.64,
        orders: 8,
        quantitySold: 36
      }
    ]
  }
}

const sampleFinanceDashboard = {
  totalPlatformRevenue: 20750,
  subscriptionRevenue: {
    mrr: 20000,
    arr: 240000,
    activeSubscriptions: 2
  },
  transactionRevenue: {
    total: 750,
    commissions: 750,
    orders: 5
  },
  pendingPayoutsSummary: {
    total: 0,
    count: 0
  },
  subscriptionStats: {
    byTier: {
      'Enterprise': 2
    },
    totalActive: 2
  },
  recentSubscriptions: [
    {
      id: 'sub_001',
      vendor: 'Tech Store',
      plan: 'Enterprise',
      tier: 'Enterprise',
      price: 10000,
      status: 'ACTIVE',
      startDate: '2024-01-01',
      isTrial: false
    }
  ],
  pendingPayouts: []
}

const sampleFinanceTransactions = {
  totalTransactions: 5,
  grossRevenue: 15000,
  platformCommission: 750,
  netToVendors: 14250,
  transactions: [
    {
      id: 'txn_001',
      vendor: 'Tech Store',
      amount: 3000,
      commission: 150,
      netAmount: 2850,
      status: 'COMPLETED',
      date: '2024-01-15'
    }
  ]
}

const sampleFinanceCommissions = {
  totalCommission: 750,
  grossRevenue: 15000,
  averageRate: 5.0,
  activeVendors: 2,
  commissions: [
    {
      vendor: 'Tech Store',
      amount: 150,
      rate: 0.05,
      orderTotal: 3000,
      orderCount: 1,
      status: 'PAID',
      createdAt: '2024-01-15'
    }
  ]
}

const sampleFinancePayouts = {
  upcomingPayouts: 0,
  thisMonthPaid: 0,
  nextPayoutDate: null,
  totalThisYear: 0,
  payouts: []
}

export default function TestExportPage() {
  const [isExporting, setIsExporting] = useState(false)

  const handleTestExport = async (format: 'xlsx' | 'pdf' | 'docx') => {
    setIsExporting(true)
    try {
      const exportData = AnalyticsExportUtils.transformComprehensiveData(sampleReport)
      await ExportService.export(exportData, {
        filename: 'test-analytics-report',
        format,
        includeSummary: true
      })
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Export Functionality Test</h1>
        <p className="text-muted-foreground">Test the export functionality with sample data</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Report Test */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Report</CardTitle>
                <CardDescription>Test revenue data export</CardDescription>
              </div>
              <ExportDropdown
                data={AnalyticsExportUtils.transformRevenueData(sampleReport)}
                filename="test-revenue-report"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>Total Revenue: ${sampleReport.revenue.totalRevenue.toLocaleString()}</div>
              <div>Total Orders: {sampleReport.revenue.totalOrders}</div>
              <div>Growth: {sampleReport.revenue.revenueGrowth}%</div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Performance Test */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Vendor Performance</CardTitle>
                <CardDescription>Test vendor data export</CardDescription>
              </div>
              <ExportDropdown
                data={AnalyticsExportUtils.transformVendorData(sampleReport)}
                filename="test-vendor-report"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>Total Vendors: {sampleReport.vendors.totalVendors}</div>
              <div>Active Vendors: {sampleReport.vendors.activeVendors}</div>
              <div>New Vendors: {sampleReport.vendors.newVendors}</div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Report Test */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction Report</CardTitle>
                <CardDescription>Test transaction data export</CardDescription>
              </div>
              <ExportDropdown
                data={AnalyticsExportUtils.transformTransactionData(sampleReport)}
                filename="test-transaction-report"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>Total Transactions: {sampleReport.transactions.length}</div>
              <div>Total Amount: ${sampleReport.transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</div>
              <div>Average: ${(sampleReport.transactions.reduce((sum, t) => sum + t.amount, 0) / sampleReport.transactions.length).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Report Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Comprehensive Analytics Report</CardTitle>
              <CardDescription>Test comprehensive data export with all formats</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformComprehensiveData(sampleReport)}
              filename="test-comprehensive-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">${sampleReport.revenue.totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleReport.revenue.totalOrders}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleReport.customers.totalCustomers}</div>
              <div className="text-sm text-muted-foreground">Total Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleReport.vendors.activeVendors}</div>
              <div className="text-sm text-muted-foreground">Active Vendors</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Management Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Commission Management Export</CardTitle>
              <CardDescription>Test commission data export functionality</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformCommissionData(sampleCommissions, sampleCommissionStats)}
              filename="test-commission-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">${sampleCommissionStats.totalCommissions.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Commissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleCommissionStats.PENDING?.count || 0}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleCommissionStats.CALCULATED?.count || 0}</div>
              <div className="text-sm text-muted-foreground">Calculated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleCommissionStats.PAID?.count || 0}</div>
              <div className="text-sm text-muted-foreground">Paid</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Management Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payout Management Export</CardTitle>
              <CardDescription>Test payout data export functionality</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformPayoutData(samplePayouts, samplePayoutStats)}
              filename="test-payout-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold">{samplePayoutStats.PENDING?.count || 0}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{samplePayoutStats.PROCESSING?.count || 0}</div>
              <div className="text-sm text-muted-foreground">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{samplePayoutStats.COMPLETED?.count || 0}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{samplePayoutStats.FAILED?.count || 0}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${((samplePayoutStats.COMPLETED?.total || 0) + (samplePayoutStats.PROCESSING?.total || 0) + (samplePayoutStats.PENDING?.total || 0)).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Processed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Management Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Management Export</CardTitle>
              <CardDescription>Test inventory data export functionality</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformInventoryData(sampleInventoryReport, sampleStockAlerts)}
              filename="test-inventory-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleInventoryReport.totalProducts}</div>
              <div className="text-sm text-muted-foreground">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${sampleInventoryReport.totalValue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleInventoryReport.lowStockProducts}</div>
              <div className="text-sm text-muted-foreground">Low Stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleInventoryReport.outOfStockProducts}</div>
              <div className="text-sm text-muted-foreground">Out of Stock</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Dashboard Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Admin Dashboard Export</CardTitle>
              <CardDescription>Test admin dashboard data export functionality</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformAdminDashboardData(sampleDashboardData)}
              filename="test-admin-dashboard-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">${sampleDashboardData.totalRevenue.toLocaleString()}/month</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleDashboardData.activeVendors}</div>
              <div className="text-sm text-muted-foreground">Active Vendors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleDashboardData.pendingApprovals}</div>
              <div className="text-sm text-muted-foreground">Pending Approvals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleDashboardData.activeShipments}</div>
              <div className="text-sm text-muted-foreground">Active Shipments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Management Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Management Export</CardTitle>
              <CardDescription>Test product data export functionality</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformProductManagementData(sampleProducts, sampleProductStats)}
              filename="test-product-management-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleProductStats.totalProducts}</div>
              <div className="text-sm text-muted-foreground">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleProductStats.activeProducts}</div>
              <div className="text-sm text-muted-foreground">Active Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleProductStats.pendingProducts}</div>
              <div className="text-sm text-muted-foreground">Pending Approval</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleProductStats.lowStockProducts}</div>
              <div className="text-sm text-muted-foreground">Low Stock</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Management Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shipping Management Export</CardTitle>
              <CardDescription>Test shipping data export functionality</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformShippingData(sampleShipments, sampleShippingStats)}
              filename="test-shipping-management-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleShippingStats.totalShipments}</div>
              <div className="text-sm text-muted-foreground">Total Shipments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleShippingStats.deliveredShipments}</div>
              <div className="text-sm text-muted-foreground">Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleShippingStats.inTransitShipments}</div>
              <div className="text-sm text-muted-foreground">In Transit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleShippingStats.averageDeliveryTime} days</div>
              <div className="text-sm text-muted-foreground">Avg Delivery Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Management Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order Management Export</CardTitle>
              <CardDescription>Test order data export functionality</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformOrderData(sampleOrders, sampleOrderStats)}
              filename="test-order-management-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleOrderStats.totalOrders}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleOrderStats.pendingOrders}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleOrderStats.inTransit}</div>
              <div className="text-sm text-muted-foreground">In Transit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{sampleOrderStats.delivered}</div>
              <div className="text-sm text-muted-foreground">Delivered</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Payout Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vendor Payout Export Test</CardTitle>
              <CardDescription>Test export functionality for vendor payout data</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformVendorPayoutData(samplePayouts, sampleWalletData, samplePayoutSettings)}
              filename="test-vendor-payout-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>Available Balance: ${sampleWalletData.availableBalance.toLocaleString()}</div>
            <div>Total Earned: ${sampleWalletData.totalEarnings.toLocaleString()}</div>
            <div>Total Paid Out: ${sampleWalletData.totalPaidOut.toLocaleString()}</div>
            <div>Payout Frequency: {samplePayoutSettings.payoutFrequency}</div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Inventory Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vendor Inventory Export Test</CardTitle>
              <CardDescription>Test export functionality for vendor inventory data</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformVendorInventoryData(sampleVendorInventory, sampleVendorInventoryAlerts, {
                totalProducts: sampleVendorInventory.length,
                lowStockProducts: sampleVendorInventory.filter(p => p.isLowStock).length,
                outOfStockProducts: sampleVendorInventory.filter(p => p.isOutOfStock).length,
                totalValue: 0
              })}
              filename="test-vendor-inventory-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>Total Products: {sampleVendorInventory.length}</div>
            <div>Low Stock Products: {sampleVendorInventory.filter(p => p.isLowStock).length}</div>
            <div>Out of Stock Products: {sampleVendorInventory.filter(p => p.isOutOfStock).length}</div>
            <div>Active Alerts: {sampleVendorInventoryAlerts.length}</div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Analytics Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vendor Analytics Export Test</CardTitle>
              <CardDescription>Test export functionality for vendor analytics data</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformVendorAnalyticsData(sampleVendorAnalytics)}
              filename="test-vendor-analytics-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>Total Revenue: ${sampleVendorAnalytics.revenue.totalRevenue.toLocaleString()}</div>
            <div>Net Revenue: ${sampleVendorAnalytics.revenue.netRevenue.toLocaleString()}</div>
            <div>Total Orders: {sampleVendorAnalytics.revenue.totalOrders}</div>
            <div>Total Customers: {sampleVendorAnalytics.customers.totalCustomers}</div>
          </div>
        </CardContent>
      </Card>

      {/* Finance Dashboard Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Finance Dashboard Export Test</CardTitle>
              <CardDescription>Test export functionality for finance dashboard data</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformFinanceDashboardData(sampleFinanceDashboard)}
              filename="test-finance-dashboard-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>Total Platform Revenue: ₱{sampleFinanceDashboard.totalPlatformRevenue.toLocaleString()}</div>
            <div>Monthly Recurring Revenue: ₱{sampleFinanceDashboard.subscriptionRevenue.mrr.toLocaleString()}</div>
            <div>Active Subscriptions: {sampleFinanceDashboard.subscriptionRevenue.activeSubscriptions}</div>
            <div>Transaction Commissions: ₱{sampleFinanceDashboard.transactionRevenue.commissions.toLocaleString()}</div>
          </div>
        </CardContent>
      </Card>

      {/* Finance Transactions Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Finance Transactions Export Test</CardTitle>
              <CardDescription>Test export functionality for finance transactions data</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformFinanceTransactionsData(sampleFinanceTransactions)}
              filename="test-finance-transactions-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>Total Transactions: {sampleFinanceTransactions.totalTransactions}</div>
            <div>Gross Revenue: ₱{sampleFinanceTransactions.grossRevenue.toLocaleString()}</div>
            <div>Platform Commission: ₱{sampleFinanceTransactions.platformCommission.toLocaleString()}</div>
            <div>Net to Vendors: ₱{sampleFinanceTransactions.netToVendors.toLocaleString()}</div>
          </div>
        </CardContent>
      </Card>

      {/* Finance Commissions Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Finance Commissions Export Test</CardTitle>
              <CardDescription>Test export functionality for finance commissions data</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformFinanceCommissionsData(sampleFinanceCommissions)}
              filename="test-finance-commissions-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>Total Commission: ₱{sampleFinanceCommissions.totalCommission.toLocaleString()}</div>
            <div>Gross Revenue: ₱{sampleFinanceCommissions.grossRevenue.toLocaleString()}</div>
            <div>Average Rate: {sampleFinanceCommissions.averageRate.toFixed(1)}%</div>
            <div>Active Vendors: {sampleFinanceCommissions.activeVendors}</div>
          </div>
        </CardContent>
      </Card>

      {/* Finance Payouts Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Finance Payouts Export Test</CardTitle>
              <CardDescription>Test export functionality for finance payouts data</CardDescription>
            </div>
            <ExportDropdown
              data={AnalyticsExportUtils.transformFinancePayoutsData(sampleFinancePayouts)}
              filename="test-finance-payouts-report"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>Upcoming Payouts: ₱{sampleFinancePayouts.upcomingPayouts.toLocaleString()}</div>
            <div>This Month Paid: ₱{sampleFinancePayouts.thisMonthPaid.toLocaleString()}</div>
            <div>Next Payout Date: {sampleFinancePayouts.nextPayoutDate || 'N/A'}</div>
            <div>Total This Year: ₱{sampleFinancePayouts.totalThisYear.toLocaleString()}</div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Format Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Format Tests</CardTitle>
          <CardDescription>Test individual export formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={() => handleTestExport('xlsx')} 
              disabled={isExporting}
              variant="outline"
            >
              Test Excel Export
            </Button>
            <Button 
              onClick={() => handleTestExport('pdf')} 
              disabled={isExporting}
              variant="outline"
            >
              Test PDF Export
            </Button>
            <Button 
              onClick={() => handleTestExport('docx')} 
              disabled={isExporting}
              variant="outline"
            >
              Test Word Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
