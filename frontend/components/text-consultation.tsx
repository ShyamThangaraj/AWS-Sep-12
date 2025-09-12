"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface TextConsultationProps {
  selectedFounder: string
  consultation: string
  uploadedFiles: File[]
  onConsultationComplete?: (conversation: string, sessionId: string) => void
}

export function TextConsultation({
  selectedFounder,
  consultation,
  uploadedFiles,
  onConsultationComplete,
}: TextConsultationProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Initialize conversation with founder's greeting
    const initialMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: `Hello! I'm ${getFounderName(selectedFounder)}. I've reviewed your business challenge: "${consultation.substring(0, 150)}${consultation.length > 150 ? "..." : ""}". ${uploadedFiles.length > 0 ? `I also see you've shared ${uploadedFiles.length} supporting documents. ` : ""}Let's dive into this strategically. What specific aspect would you like to explore first?`,
      timestamp: new Date(),
    }
    setMessages([initialMessage])
  }, [selectedFounder, consultation, uploadedFiles])

  const getFounderName = (founderId: string) => {
    const founders: Record<string, string> = {
      "bill-gates": "Bill Gates",
      "elon-musk": "Elon Musk",
      "steve-jobs": "Steve Jobs",
      "jeff-bezos": "Jeff Bezos",
      "mark-zuckerberg": "Mark Zuckerberg",
      "larry-page": "Larry Page",
    }
    return founders[founderId] || "Founder"
  }

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: currentMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setCurrentMessage("")
    setIsLoading(true)

    try {
      // Call your AI API (this would integrate with your FastAPI backend)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          founder: selectedFounder,
          sessionId,
          originalConsultation: consultation,
          fileCount: uploadedFiles.length,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("[v0] Chat error:", error)
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content:
          "I apologize, but I'm having trouble connecting right now. Could you please try rephrasing your question?",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const endConsultation = () => {
    const conversation = messages
      .map((msg) => `${msg.role === "user" ? "You" : getFounderName(selectedFounder)}: ${msg.content}`)
      .join("\n\n")

    if (onConsultationComplete) {
      onConsultationComplete(conversation, sessionId)
    }
  }

  return (
    <Card className="border-border/50 shadow-lg h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between font-[family-name:var(--font-space-grotesk)]">
          <span className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent" />
            Text Consultation with {getFounderName(selectedFounder)}
          </span>
          <Badge variant="outline" className="text-xs">
            Session: {sessionId.slice(-8)}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3 text-sm leading-relaxed",
                  message.role === "user" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {message.content}
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-accent" />
              </div>
              <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 p-4">
          <div className="flex gap-2">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask your strategic question..."
              className="flex-1 min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isLoading}
                size="sm"
                className="h-[60px] px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</span>
            <Button onClick={endConsultation} variant="outline" size="sm" className="text-xs bg-transparent">
              End Consultation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
