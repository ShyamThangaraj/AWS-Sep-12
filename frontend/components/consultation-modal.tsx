"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TextConsultation } from "@/components/text-consultation"
import { X } from "lucide-react"

interface ConsultationModalProps {
  isOpen: boolean
  onClose: () => void
  selectedFounder: string
  consultation: string
  uploadedFiles: File[]
  onConsultationComplete?: (transcript: string, callId: string, type: "voice" | "text") => void
}

export function ConsultationModal({
  isOpen,
  onClose,
  selectedFounder,
  consultation,
  uploadedFiles,
  onConsultationComplete,
}: ConsultationModalProps) {
  const [activeTab, setActiveTab] = useState("text")

  const handleTextComplete = (conversation: string, sessionId: string) => {
    saveTranscriptToStorage(conversation, sessionId, "text")
    if (onConsultationComplete) {
      onConsultationComplete(conversation, sessionId, "text")
    }
  }

  const saveTranscriptToStorage = (content: string, id: string, type: "voice" | "text") => {
    const transcript = {
      id: id,
      type: type,
      founder: selectedFounder,
      title: generateTranscriptTitle(consultation),
      content: content,
      summary: generateSummary(content),
      duration: type === "voice" ? Math.floor(Math.random() * 1200) + 300 : undefined,
      messageCount: type === "text" ? content.split("\n\n").length : undefined,
      createdAt: new Date(),
      tags: generateTags(consultation, content),
      isStarred: false,
      isArchived: false,
    }

    const existingTranscripts = JSON.parse(localStorage.getItem("founder-counsel-transcripts") || "[]")
    const updatedTranscripts = [...existingTranscripts, transcript]
    localStorage.setItem("founder-counsel-transcripts", JSON.stringify(updatedTranscripts))
  }

  const generateTranscriptTitle = (consultation: string) => {
    const words = consultation.split(" ").slice(0, 6).join(" ")
    return words.length > 50 ? words.substring(0, 47) + "..." : words
  }

  const generateSummary = (content: string) => {
    // Simple summary generation - in production this would use AI
    const sentences = content.split(".").slice(0, 3)
    return sentences.join(".") + (sentences.length === 3 ? "." : "")
  }

  const generateTags = (consultation: string, content: string) => {
    const commonBusinessTerms = [
      "scaling",
      "strategy",
      "product",
      "marketing",
      "sales",
      "funding",
      "team",
      "leadership",
      "innovation",
      "growth",
      "operations",
      "technology",
    ]

    const text = (consultation + " " + content).toLowerCase()
    return commonBusinessTerms.filter((term) => text.includes(term)).slice(0, 3)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">
                Strategic Consultation
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                Start a text-based consultation with your selected advisor
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6">
          <TextConsultation
            selectedFounder={selectedFounder}
            consultation={consultation}
            uploadedFiles={uploadedFiles}
            onConsultationComplete={handleTextComplete}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
