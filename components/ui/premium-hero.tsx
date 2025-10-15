"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'spline-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        url?: string;
        style?: React.CSSProperties;
      }
    }
  }
}

export function PremiumHero() {
  const splineRef = useRef<HTMLDivElement>(null)
  const [splineLoaded, setSplineLoaded] = useState(false)
  const [splineError, setSplineError] = useState(false)

  useEffect(() => {
    // Load Spline viewer script
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@splinetool/viewer@0.9.425/build/spline-viewer.js'
    script.type = 'module'
    
    script.onload = () => {
      setSplineLoaded(true)
    }
    
    script.onerror = () => {
      setSplineError(true)
    }
    
    document.head.appendChild(script)

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* 3D Spline Scene */}
      {splineLoaded && !splineError && (
        <div 
          ref={splineRef}
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 1 }}
        >
          {/* @ts-ignore */}
          <spline-viewer 
            url="/glass_wave.spline"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}
      
      {/* Fallback Animated Background */}
      {(!splineLoaded || splineError) && (
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Content Overlay */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-block mb-4">
            <Badge 
              variant="outline" 
              className="text-sm font-medium px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm"
            >
              Platform for Revenue Management
            </Badge>
          </div>

          {/* Main Header with Premium Gradient */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.9] hero-animate">
            <span className="gradient-text-primary block">Manage.</span>
            <span className="gradient-text-primary block">Monetize.</span>
            <span className="gradient-text-accent block">Scale.</span>
          </h1>

          {/* Subheader */}
          <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground/90 max-w-3xl mx-auto leading-relaxed hero-animate-delay-1">
            The smarter way to scale your commerce.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 hero-animate-delay-2">
            <Button
              size="lg"
              asChild
              className="text-lg h-14 px-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-2xl shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 backdrop-blur-sm"
            >
              <Link href="/login">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="text-lg h-14 px-10 bg-transparent/80 backdrop-blur-sm border-white/20 hover:bg-white/10"
            >
              <Link href="/shop">Explore Platform</Link>
            </Button>
          </div>

          {/* Interactive Hint */}
          <p className="text-sm text-muted-foreground/70 mt-12 hero-animate-delay-3">
            Press on the canvas to focus and interact
          </p>
        </div>
      </div>

      {/* Gradient Overlay for Better Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/40 pointer-events-none" />
    </section>
  )
}
