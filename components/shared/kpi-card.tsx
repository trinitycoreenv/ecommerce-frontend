import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  description?: string
  className?: string
}

export function KPICard({ title, value, icon, trend, description, className }: KPICardProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-caption text-xs md:text-sm text-caption text-muted-foreground truncate">{title}</CardTitle>
        {icon && <div className="text-muted-foreground flex-shrink-0">{icon}</div>}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl md:text-3xl text-title font-bold">{value}</div>
        {trend && (
          <div className="flex items-center gap-1 flex-wrap">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-success flex-shrink-0" />
            ) : (
              <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-destructive flex-shrink-0" />
            )}
            <span className={cn("text-xs md:text-sm font-medium", trend.isPositive ? "text-success" : "text-destructive")}>
              {trend.value}%
            </span>
            <span className="text-body text-xs md:text-sm text-muted-foreground hidden sm:inline">from last month</span>
          </div>
        )}
        {description && <p className="text-body text-xs md:text-sm text-muted-foreground line-clamp-2">{description}</p>}
      </CardContent>
    </Card>
  )
}
