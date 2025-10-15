"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface WorkingCarouselProps {
  children: React.ReactNode[]
  direction?: "left" | "right"
  speed?: "slow" | "medium" | "fast"
  pauseOnHover?: boolean
  className?: string
}

export function WorkingCarousel({
  children,
  direction = "left",
  speed = "medium",
  pauseOnHover = true,
  className,
}: WorkingCarouselProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [animationId, setAnimationId] = useState<string>("")

  const getDuration = () => {
    switch (speed) {
      case "slow": return 40
      case "medium": return 30
      case "fast": return 20
      default: return 30
    }
  }

  useEffect(() => {
    const uniqueId = `carousel-${Math.random().toString(36).substr(2, 9)}`
    setAnimationId(uniqueId)

    const style = document.createElement('style')
    const duration = getDuration()
    
    style.textContent = `
      @keyframes ${uniqueId} {
        0% {
          transform: translateX(${direction === "left" ? "0" : "-50%"});
        }
        100% {
          transform: translateX(${direction === "left" ? "-50%" : "0"});
        }
      }
      .${uniqueId} {
        animation: ${uniqueId} ${duration}s linear infinite;
      }
      .${uniqueId}.paused {
        animation-play-state: paused;
      }
    `
    
    document.head.appendChild(style)
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [direction, speed])

  return (
    <div
      className={cn("overflow-hidden", className)}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div
        className={cn(
          "flex gap-6",
          animationId,
          isPaused && "paused"
        )}
        style={{
          width: "max-content",
        }}
      >
        {/* Duplicate content for seamless loop */}
        {children}
        {children}
      </div>
    </div>
  )
}
