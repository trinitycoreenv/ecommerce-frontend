'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function AnimatedHeroText() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Fallback during hydration
    return (
      <h1 className="font-readex-pro font-extralight text-3xl md:text-5xl lg:text-6xl xl:text-8xl leading-[120%] tracking-[0px] text-balance">
        <span className="inline-block text-primary">Manage.</span>
        <span className="mx-2 md:mx-4"></span>
        <span className="inline-block text-primary">Monetize.</span>
        <span className="mx-2 md:mx-4"></span>
        <span className="inline-block text-primary">Scale.</span>
      </h1>
    )
  }

  // Dark theme gradients (brighter, more contrast) - More dramatic color differences
  const darkGradients = {
    manage: 'linear-gradient(45deg, #0A84FF, #FFFFFF, #4FACFE, #0A84FF, #FFFFFF, #4FACFE)',
    monetize: 'linear-gradient(45deg, #1D976C, #FFFFFF, #93F9B9, #1D976C, #FFFFFF, #93F9B9)',
    scale: 'linear-gradient(45deg, #6A11CB, #FFFFFF, #2575FC, #6A11CB, #FFFFFF, #2575FC)'
  }

  // Light theme gradients (deeper, more contrast on white) - More dramatic color differences
  const lightGradients = {
    manage: 'linear-gradient(45deg, #1E3A8A, #BFDBFE, #3B82F6, #1E3A8A, #BFDBFE, #3B82F6)',
    monetize: 'linear-gradient(45deg, #065F46, #A7F3D0, #34D399, #065F46, #A7F3D0, #34D399)',
    scale: 'linear-gradient(45deg, #4338CA, #DBEAFE, #2563EB, #4338CA, #DBEAFE, #2563EB)'
  }

  const gradients = theme === 'dark' ? darkGradients : lightGradients

  // Dark theme shadows (white glow)
  const darkShadows = {
    manage: 'drop-shadow(0 0 12px rgba(10, 132, 255, 0.4))',
    monetize: 'drop-shadow(0 0 12px rgba(29, 151, 108, 0.4))',
    scale: 'drop-shadow(0 0 12px rgba(106, 17, 203, 0.4))'
  }

  // Light theme shadows (subtle blue/gray)
  const lightShadows = {
    manage: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.2))',
    monetize: 'drop-shadow(0 0 8px rgba(6, 95, 70, 0.2))',
    scale: 'drop-shadow(0 0 8px rgba(67, 56, 202, 0.2))'
  }

  const shadows = theme === 'dark' ? darkShadows : lightShadows

  return (
    <h1 className="text-hero text-3xl md:text-5xl lg:text-6xl xl:text-8xl text-balance">
      <span 
        className="inline-block animate-gradient-manage"
        style={{
          fontFamily: 'Readex Pro, sans-serif',
          lineHeight: '120%',
          letterSpacing: '0px',
          fontWeight: '200',
          background: gradients.manage,
          backgroundSize: '400% 400%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'gradientFlow 2s ease-in-out infinite',
          filter: shadows.manage,
          display: 'inline-block'
        }}
      >
        Manage.
      </span>
      <span className="mx-2 md:mx-4"></span>
      <span 
        className="inline-block animate-gradient-monetize"
        style={{
          fontFamily: 'Readex Pro, sans-serif',
          lineHeight: '120%',
          letterSpacing: '0px',
          fontWeight: '200',
          background: gradients.monetize,
          backgroundSize: '400% 400%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'gradientFlow 2s ease-in-out infinite 0.6s',
          filter: shadows.monetize,
          display: 'inline-block'
        }}
      >
        Monetize.
      </span>
      <span className="mx-2 md:mx-4"></span>
      <span 
        className="inline-block animate-gradient-scale"
        style={{
          fontFamily: 'Readex Pro, sans-serif',
          lineHeight: '120%',
          letterSpacing: '0px',
          fontWeight: '200',
          background: gradients.scale,
          backgroundSize: '400% 400%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'gradientFlow 2s ease-in-out infinite 1.2s',
          filter: shadows.scale,
          display: 'inline-block'
        }}
      >
        Scale.
      </span>
    </h1>
  )
}
