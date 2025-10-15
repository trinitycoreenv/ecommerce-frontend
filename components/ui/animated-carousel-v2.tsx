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

export function AnimatedCarouselV2({
  children,
  direction = "left",
  speed = "medium",
  pauseOnHover = true,
  className,
}: AnimatedCarouselProps) {
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const getDuration = () => {
    switch (speed) {
      case "slow": return "40s"
      case "medium": return "30s"
      case "fast": return "20s"
      default: return "30s"
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

  useEffect(() => {
    if (containerRef.current) {
      const style = document.createElement('style')
      const animationName = `scroll-${direction}-${speed}`
      const keyframes = getKeyframes()
      const duration = getDuration()
      
      style.textContent = `
        @keyframes ${animationName} {
          0% { transform: translateX(${direction === "left" ? "0" : "-50%"}); }
          100% { transform: translateX(${direction === "left" ? "-50%" : "0"}); }
        }
        .${animationName} {
          animation: ${animationName} ${duration} linear infinite;
        }
        .${animationName}:hover {
          animation-play-state: ${isPaused ? "paused" : "running"};
        }
      `
      
      document.head.appendChild(style)
      
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [direction, speed, isPaused])

  const animationClass = `scroll-${direction}-${speed}`

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
          !isPaused && animationClass
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
