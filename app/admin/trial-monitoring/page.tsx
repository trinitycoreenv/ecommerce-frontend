'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Users, TrendingUp, Shield, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface TrialUsage {
  id: string
  email: string
  phoneNumber?: string
  ipAddress: string
  paymentCardLast4?: string
  trialStartDate: string
  trialEndDate: string
  status: 'ACTIVE' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED'
  fraudScore: number
  isFraudulent: boolean
  notes?: string
  createdAt: string
  user: {
    name: string
    email: string
  }
  plan: {
    name: string
    tier: string
  }
}

interface TrialStats {
  totalTrials: number
  activeTrials: number
  convertedTrials: number
  fraudulentTrials: number
  conversionRate: number
  fraudRate: number
}

const columns = [
  {
    accessorKey: 'user.name',
    header: 'User',
    cell: ({ row }: any) => (
      <div>
        <div className="font-medium">{row.original.user.name}</div>
        <div className="text-sm text-muted-foreground">{row.original.email}</div>
      </div>
    ),
  },
  {
    accessorKey: 'plan.name',
    header: 'Plan',
    cell: ({ row }: any) => (
      <Badge variant="outline">
        {row.original.plan.name}
      </Badge>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }: any) => {
      const status = row.original.status
      const variants: any = {
        ACTIVE: 'default',
        CONVERTED: 'default',
        EXPIRED: 'secondary',
        CANCELLED: 'destructive'
      }
      return (
        <Badge variant={variants[status] || 'secondary'}>
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'fraudScore',
    header: 'Fraud Score',
    cell: ({ row }: any) => {
      const score = row.original.fraudScore
      const isFraudulent = row.original.isFraudulent
      
      if (isFraudulent) {
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {score} (HIGH)
          </Badge>
        )
      } else if (score >= 20) {
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {score} (MED)
          </Badge>
        )
      } else {
        return (
          <Badge variant="outline">
            {score} (LOW)
          </Badge>
        )
      }
    },
  },
  {
    accessorKey: 'trialStartDate',
    header: 'Trial Start',
    cell: ({ row }: any) => new Date(row.original.trialStartDate).toLocaleDateString(),
  },
  {
    accessorKey: 'trialEndDate',
    header: 'Trial End',
    cell: ({ row }: any) => new Date(row.original.trialEndDate).toLocaleDateString(),
  },
  {
    accessorKey: 'ipAddress',
    header: 'IP Address',
    cell: ({ row }: any) => (
      <span className="font-mono text-sm">{row.original.ipAddress}</span>
    ),
  },
]

export default function TrialMonitoringPage() {
  const [trialUsage, setTrialUsage] = useState<TrialUsage[]>([])
  const [stats, setStats] = useState<TrialStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrialData()
  }, [])

  const fetchTrialData = async () => {
    try {
      const [usageResponse, statsResponse] = await Promise.all([
        fetch('/api/trials/usage'),
        fetch('/api/trials/stats')
      ])

      if (usageResponse.ok) {
        const usageData = await usageResponse.json()
        setTrialUsage(usageData.data || [])
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }
    } catch (error) {
      console.error('Error fetching trial data:', error)
      toast.error('Failed to load trial monitoring data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trial Monitoring</h1>
            <p className="text-muted-foreground">Monitor trial usage and fraud prevention</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trial Monitoring</h1>
          <p className="text-muted-foreground">Monitor trial usage and fraud prevention</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Trials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrials}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Active Trials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.activeTrials}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.conversionRate}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Fraud Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.fraudRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trial Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trial Usage History</CardTitle>
          <CardDescription>
            Monitor all trial signups with fraud prevention scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trialUsage.length > 0 ? (
            <DataTable columns={columns} data={trialUsage} />
          ) : (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No trial usage data"
              description="No trial signups have been recorded yet."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
