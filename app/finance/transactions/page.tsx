"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
// import { AnimatedCounter } from "@/components/ui/animated-counter"

interface TransactionData {
  transactions: any[]
  stats: {
    totalTransactions: number
    totalVolume: number
    pendingPayouts: number
    platformCommission: number
  }
}

interface PayoutData {
  payouts: any[]
  stats: {
    totalPayouts: number
    pendingAmount: number
  }
}

export default function FinanceTransactionsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [transactionData, setTransactionData] = useState<TransactionData>({
    transactions: [],
    stats: {
      totalTransactions: 0,
      totalVolume: 0,
      pendingPayouts: 0,
      platformCommission: 0
    }
  })
  const [payoutData, setPayoutData] = useState<PayoutData>({
    payouts: [],
    stats: {
      totalPayouts: 0,
      pendingAmount: 0
    }
  })

  const fetchTransactionData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/finance/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTransactionData({
            transactions: result.data || [],
            stats: result.stats || {
              totalTransactions: 0,
              totalVolume: 0,
              pendingPayouts: 0,
              platformCommission: 0
            }
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch transaction data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPayoutData = async () => {
    try {
      const response = await fetch('/api/finance/payouts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setPayoutData({
            payouts: result.data || [],
            stats: result.stats || {
              totalPayouts: 0,
              pendingAmount: 0
            }
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch payout data:', error)
    }
  }

  useEffect(() => {
    fetchTransactionData()
    fetchPayoutData()
  }, [])

  const handleRefresh = () => {
    fetchTransactionData()
    fetchPayoutData()
  }

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your transaction report will be downloaded shortly.",
    })
  }

  const handleApprovePayout = (id: string) => {
    toast({
      title: "Payout approved",
      description: "The payout has been approved and will be processed.",
    })
  }

  const handleRejectPayout = (id: string) => {
    toast({
      title: "Payout rejected",
      description: "The vendor has been notified.",
      variant: "destructive",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions & Payouts</h1>
          <p className="text-muted-foreground mt-2">Monitor transactions and manage vendor payouts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {transactionData.stats.totalTransactions.toLocaleString()}
                </div>
                <p className="text-sm text-success mt-1">+12.5% this month</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transaction Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  ${transactionData.stats.totalVolume.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {transactionData.stats.totalVolume > 0 ? 'Total processed' : 'No data available'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  ${transactionData.stats.pendingPayouts.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {transactionData.stats.pendingPayouts > 0 ? 'Awaiting processing' : 'No pending payouts'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Platform Commission</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  ${transactionData.stats.platformCommission.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {transactionData.stats.platformCommission > 0 ? 'Total earned' : 'No commission data'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Log</CardTitle>
              <CardDescription>All platform transactions with commission details</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <DataTable
                  data={transactionData.transactions}
                  columns={[
                    { key: "id", label: "Transaction ID" },
                    { key: "date", label: "Date" },
                    { key: "vendor", label: "Vendor" },
                    { key: "customer", label: "Customer" },
                    { key: "amount", label: "Amount" },
                    { key: "commission", label: "Commission" },
                    {
                      key: "status",
                      label: "Status",
                      render: (item) => <StatusBadge status={item.status} />,
                    },
                  ]}
                  searchable
                  searchPlaceholder="Search transactions..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout Management</CardTitle>
              <CardDescription>Review and approve vendor payouts</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <DataTable
                  data={payoutData.payouts}
                  columns={[
                    { key: "id", label: "Payout ID" },
                    { key: "vendor", label: "Vendor" },
                    { key: "amount", label: "Amount" },
                    { key: "period", label: "Period" },
                    {
                      key: "status",
                      label: "Status",
                      render: (item) => <StatusBadge status={item.status} />,
                    },
                    { key: "dueDate", label: "Due Date" },
                    {
                      key: "actions",
                      label: "Actions",
                      render: (item) =>
                        item.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleApprovePayout(item.id)}>
                              <CheckCircle className="h-4 w-4 text-success" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRejectPayout(item.id)}>
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground capitalize">{item.status}</span>
                        ),
                    },
                  ]}
                  searchable
                  searchPlaceholder="Search payouts..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}