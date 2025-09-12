"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RippleButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
}

export function RippleButton({ children, className, onClick, ...props }: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const buttonRef = useRef<HTMLButtonElement>(null)

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return

    const button = buttonRef.current
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const newRipple = {
      id: Date.now(),
      x,
      y,
    }

    setRipples((prev) => [...prev, newRipple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id))
    }, 600)

    // Call original onClick if provided
    if (onClick) {
      onClick(event)
    }
  }

  return (
    <Button
      ref={buttonRef}
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        className,
      )}
      onClick={createRipple}
      {...props}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: "100px",
            height: "100px",
            animationDuration: "0.6s",
          }}
        />
      ))}
    </Button>
  )
}
