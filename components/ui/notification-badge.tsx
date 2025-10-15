"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface NotificationBadgeProps {
  count: number
  className?: string
  maxCount?: number
  showZero?: boolean
}

export function NotificationBadge({ 
  count, 
  className, 
  maxCount = 99,
  showZero = false 
}: NotificationBadgeProps) {
  const [displayCount, setDisplayCount] = useState(0)

  useEffect(() => {
    if (count === 0 && !showZero) {
      setDisplayCount(0)
      return
    }

    // Animate the count change
    const timer = setTimeout(() => {
      setDisplayCount(count)
    }, 100)

    return () => clearTimeout(timer)
  }, [count, showZero])

  if (displayCount === 0 && !showZero) {
    return null
  }

  const displayValue = displayCount > maxCount ? `${maxCount}+` : displayCount.toString()

  return (
    <div
      className={cn(
        "absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center",
        "bg-red-500 text-white text-xs font-bold rounded-full",
        "animate-pulse-slow border-2 border-white",
        "transform transition-all duration-300",
        displayCount > 0 && "scale-110",
        className
      )}
    >
      {displayValue}
    </div>
  )
}
