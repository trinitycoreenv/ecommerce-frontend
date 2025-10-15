'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  color: string
  target?: number
}

export function PlatformPerformanceChart() {
  const { theme } = useTheme()

  // Performance data - memoized to prevent re-creation on every render
  const performanceData: PerformanceMetric[] = useMemo(() => [
    {
      name: 'Response Time',
      value: 45,
      unit: 'ms',
      color: theme === 'dark' ? '#60a5fa' : '#2563eb',
      target: 100
    },
    {
      name: 'Uptime',
      value: 99.9,
      unit: '%',
      color: theme === 'dark' ? '#34d399' : '#059669',
      target: 99.5
    },
    {
      name: 'API Success Rate',
      value: 99.8,
      unit: '%',
      color: theme === 'dark' ? '#f472b6' : '#db2777',
      target: 99.0
    }
  ], [theme])

  // Custom tooltip component - memoized to prevent re-creation
  const CustomTooltip = useMemo(() => ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-body font-medium">{label}</p>
          <p className="text-caption text-primary">
            {data.value}{data.unit}
          </p>
          {data.target && (
            <p className="text-caption text-muted-foreground">
              Target: {data.target}{data.unit}
            </p>
          )}
        </div>
      )
    }
    return null
  }, [])


  return (
    <Card className="relative border-2">
      <CardHeader>
        <CardTitle className="text-heading text-sm md:text-base">Platform Performance</CardTitle>
        <CardDescription className="text-body text-xs md:text-sm">Real-time metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        {/* Chart - Mobile responsive */}
        <div className="h-48 md:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={performanceData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
                opacity={0.3}
              />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  fontSize: 10,
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  fontSize: 10,
                  fontFamily: 'Inter, sans-serif'
                }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics Summary - Mobile responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {performanceData.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-caption text-xs md:text-sm text-muted-foreground truncate">{metric.name}</span>
                <span className="text-heading text-xs md:text-sm font-medium">
                  {metric.value}{metric.unit}
                </span>
              </div>
              <div className="h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${Math.min((metric.value / (metric.target || 100)) * 100, 100)}%`,
                    backgroundColor: metric.color
                  }} 
                />
              </div>
              {metric.target && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="truncate">Target: {metric.target}{metric.unit}</span>
                  <span className={metric.value >= metric.target ? 'text-green-600' : 'text-yellow-600'}>
                    {metric.value >= metric.target ? '✓' : '⚠'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center pt-3 md:pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-caption text-xs md:text-sm text-muted-foreground">All systems operational</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}