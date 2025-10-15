"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface SimpleCarouselProps {
  children: React.ReactNode[]
  direction?: "left" | "right"
  speed?: "slow" | "medium" | "fast"
  pauseOnHover?: boolean
  className?: string
}

export function SimpleCarousel({
  children,
  direction = "left",
  speed = "medium",
  pauseOnHover = true,
  className,
}: SimpleCarouselProps) {
  const [isPaused, setIsPaused] = useState(false)

  const getDuration = () => {
    switch (speed) {
      case "slow": return 40
      case "medium": return 30
      case "fast": return 20
      default: return 30
    }
  }

  const getKeyframes = () => {
    if (direction === "left") {
      return {
        "0%": { transform: "translateX(0)" },
        "100%": { transform: "translateX(-50%)" }
      }
    } else {
      return {
        "0%": { transform: "translateX(-50%)" },
        "100%": { transform: "translateX(0)" }
      }
    }
  }

  const animationStyle = {
    animation: isPaused 
      ? "none" 
      : `${direction === "left" ? "scroll-left" : "scroll-right"} ${getDuration()}s linear infinite`,
    width: "max-content",
  }

  return (
    <div
      className={cn("overflow-hidden", className)}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div
        className="flex gap-6"
        style={animationStyle}
      >
        {/* Duplicate content for seamless loop */}
        {children}
        {children}
      </div>
    </div>
  )
}
