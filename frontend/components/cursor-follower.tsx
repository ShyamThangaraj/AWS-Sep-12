"use client"

import { useEffect, useState } from "react"

export function CursorFollower() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div
      className={`fixed pointer-events-none z-50 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        left: mousePosition.x - 10,
        top: mousePosition.y - 10,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="w-5 h-5 border-2 border-accent/50 rounded-full animate-pulse" />
      <div className="absolute inset-0 w-5 h-5 border border-accent/30 rounded-full animate-ping" />
    </div>
  )
}
