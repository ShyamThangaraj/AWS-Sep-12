"use client"

import { useEffect, useState } from "react"
import { Scale, Users, Phone, FileText, Sparkles, Briefcase } from "lucide-react"

const icons = [Scale, Users, Phone, FileText, Sparkles, Briefcase]

interface FloatingElement {
  id: number
  Icon: typeof Scale
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  scale: number
  opacity: number
}

export function FloatingElements() {
  const [elements, setElements] = useState<FloatingElement[]>([])

  useEffect(() => {
    // Initialize floating elements
    const initialElements: FloatingElement[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      Icon: icons[i % icons.length],
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
      scale: Math.random() * 0.5 + 0.5,
      opacity: Math.random() * 0.1 + 0.05,
    }))

    setElements(initialElements)

    const animate = () => {
      setElements((prev) =>
        prev.map((element) => ({
          ...element,
          x: element.x + element.vx,
          y: element.y + element.vy,
          rotation: element.rotation + element.rotationSpeed,
          // Wrap around screen edges
          ...(element.x < -50 && { x: window.innerWidth + 50 }),
          ...(element.x > window.innerWidth + 50 && { x: -50 }),
          ...(element.y < -50 && { y: window.innerHeight + 50 }),
          ...(element.y > window.innerHeight + 50 && { y: -50 }),
        })),
      )
    }

    const interval = setInterval(animate, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {elements.map((element) => {
        const Icon = element.Icon
        return (
          <div
            key={element.id}
            className="absolute text-accent/20"
            style={{
              left: element.x,
              top: element.y,
              transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
              opacity: element.opacity,
            }}
          >
            <Icon className="w-8 h-8" />
          </div>
        )
      })}
    </div>
  )
}
