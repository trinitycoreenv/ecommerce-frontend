"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Activity, TrendingUp, Package, DollarSign, Users } from "lucide-react"

interface ActivityItem {
  id: string
  type: "order" | "product" | "payment" | "user"
  message: string
  timestamp: Date
  icon: React.ReactNode
}

interface ActivityFeedProps {
  className?: string
  maxItems?: number
}

export function ActivityFeed({ className, maxItems = 5 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    // Simulate real-time activities
    const generateActivity = (): ActivityItem => {
      const types = ["order", "product", "payment", "user"] as const
      const type = types[Math.floor(Math.random() * types.length)]
      
      const messages = {
        order: [
          "New order #1234 received",
          "Order #1235 shipped",
          "Order #1236 delivered",
          "Order #1237 cancelled"
        ],
        product: [
          "Product 'Wireless Headphones' approved",
          "Product 'Smart Watch' added to catalog",
          "Product 'Laptop Stand' inventory updated",
          "Product 'Phone Case' price updated"
        ],
        payment: [
          "Payment of ₱299.99 processed",
          "Payout of ₱1,250.00 scheduled",
          "Commission of ₱45.50 calculated",
          "Refund of ₱89.99 processed"
        ],
        user: [
          "New vendor 'TechGear Solutions' registered",
          "Customer 'Alice Brown' signed up",
          "User 'John Smith' updated profile",
          "Admin 'Sarah Johnson' logged in"
        ]
      }

      const icons = {
        order: <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
        product: <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />,
        payment: <DollarSign className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />,
        user: <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        type,
        message: messages[type][Math.floor(Math.random() * messages[type].length)],
        timestamp: new Date(),
        icon: icons[type]
      }
    }

    // Add initial activities
    const initialActivities = Array.from({ length: 3 }, generateActivity)
    setActivities(initialActivities)

    // Add new activities every 10-30 seconds
    const interval = setInterval(() => {
      const newActivity = generateActivity()
      setActivities(prev => {
        const updated = [newActivity, ...prev].slice(0, maxItems)
        return updated
      })
    }, Math.random() * 20000 + 10000) // 10-30 seconds

    return () => clearInterval(interval)
  }, [maxItems])

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Live Activity</h3>
      </div>
      
      {activities.map((activity, index) => (
        <div
          key={activity.id}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border bg-card",
            "animate-slide-in-up transition-all duration-300",
            "hover:shadow-md hover:scale-[1.02]"
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex-shrink-0 mt-0.5">
            {activity.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {activity.message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {activity.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
