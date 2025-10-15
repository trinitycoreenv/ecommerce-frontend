"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedCarouselProps {
  children: React.ReactNode[]
  direction?: "left" | "right"
  speed?: "slow" | "medium" | "fast"
  pauseOnHover?: boolean
  className?: string
}

export function AnimatedCarousel({
  children,
  direction = "left",
  speed = "medium",
  pauseOnHover = true,
  className,
}: AnimatedCarouselProps) {
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const getAnimationClass = () => {
    if (direction === "left") {
      switch (speed) {
        case "slow": return "animate-scroll-slow"
        case "medium": return "animate-scroll-medium"
        case "fast": return "animate-scroll-fast"
        default: return "animate-scroll-medium"
      }
    } else {
      switch (speed) {
        case "slow": return "animate-scroll-right-slow"
        case "medium": return "animate-scroll-right-medium"
        case "fast": return "animate-scroll-right-fast"
        default: return "animate-scroll-right-medium"
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden", className)}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div
        className={cn(
          "flex gap-6",
          !isPaused && getAnimationClass()
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
