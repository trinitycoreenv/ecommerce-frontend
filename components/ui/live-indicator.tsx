"use client"

import { cn } from "@/lib/utils"

interface LiveIndicatorProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LiveIndicator({ className, size = "md" }: LiveIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3", 
    lg: "w-4 h-4"
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn(
          "rounded-full bg-green-500 animate-pulse",
          sizeClasses[size]
        )}
      />
      <span className="text-xs font-medium text-green-600 dark:text-green-400">
        Live
      </span>
    </div>
  )
}
