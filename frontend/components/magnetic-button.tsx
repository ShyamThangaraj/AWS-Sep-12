"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MagneticButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
  magneticStrength?: number
}

export function MagneticButton({
  children,
  className,
  magneticStrength = 0.3,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  ...props
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return

    const button = buttonRef.current
    const rect = button.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const deltaX = (e.clientX - centerX) * magneticStrength
    const deltaY = (e.clientY - centerY) * magneticStrength

    button.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`

    if (onMouseMove) onMouseMove(e)
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true)
    if (onMouseEnter) onMouseEnter(e)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false)
    if (buttonRef.current) {
      buttonRef.current.style.transform = "translate(0px, 0px) scale(1)"
    }
    if (onMouseLeave) onMouseLeave(e)
  }

  return (
    <Button
      ref={buttonRef}
      className={cn("transition-all duration-300 ease-out", "hover:shadow-xl", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Button>
  )
}
