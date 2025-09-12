"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  FileText,
  Search,
  Download,
  Eye,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  Star,
  Archive,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Transcript {
  id: string
  type: "voice" | "text"
  founder: string
  title: string
  content: string
  summary: string
  duration?: number
  messageCount?: number
  createdAt: Date
  tags: string[]
  isStarred: boolean
  isArchived: boolean
}

interface TranscriptManagerProps {
  onNewConsultation?: () => void
}

export function TranscriptManager({ onNewConsultation }: TranscriptManagerProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null)
  const [filterType, setFilterType] = useState<"all" | "voice" | "text">("all")
  const [filterFounder, setFilterFounder] = useState<string>("all")
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  useEffect(() => {
    // Load transcripts from localStorage or API
    loadTranscripts()
  }, [])

  const loadTranscripts = () => {
    // In a real implementation, this would fetch from your database
    const savedTranscripts = localStorage.getItem("founder-counsel-transcripts")
    if (savedTranscripts) {
      const parsed = JSON.parse(savedTranscripts).map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
      }))
      setTranscripts(parsed)
    } else {
      // Demo data
      const demoTranscripts: Transcript[] = [
        {
          id: "transcript_1",
          type: "voice",
          founder: "bill-gates",
          title: "Scaling SaaS Platform Strategy",
          content: "Full transcript of 15-minute consultation about scaling challenges...",
          summary:
            "Discussed platform scaling strategies, focusing on infrastructure, team building, and market expansion approaches based on Microsoft's early growth phases.",
          duration: 15 * 60,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          tags: ["scaling", "saas", "infrastructure"],
          isStarred: true,
          isArchived: false,
        },
        {
          id: "transcript_2",
          type: "text",
          founder: "elon-musk",
          title: "First Principles Product Development",
          content: "Text conversation about applying first principles thinking to product development...",
          summary:
            "Explored first principles methodology for product innovation, manufacturing optimization, and breakthrough thinking approaches.",
          messageCount: 24,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          tags: ["first-principles", "product", "innovation"],
          isStarred: false,
          isArchived: false,
        },
      ]
      setTranscripts(demoTranscripts)
      localStorage.setItem("founder-counsel-transcripts", JSON.stringify(demoTranscripts))
    }
  }

  const saveTranscript = (transcript: Transcript) => {
    const updated = [...transcripts, transcript]
    setTranscripts(updated)
    localStorage.setItem("founder-counsel-transcripts", JSON.stringify(updated))
  }

  const updateTranscript = (id: string, updates: Partial<Transcript>) => {
    const updated = transcripts.map((t) => (t.id === id ? { ...t, ...updates } : t))
    setTranscripts(updated)
    localStorage.setItem("founder-counsel-transcripts", JSON.stringify(updated))
  }

  const deleteTranscript = (id: string) => {
    const updated = transcripts.filter((t) => t.id !== id)
    setTranscripts(updated)
    localStorage.setItem("founder-counsel-transcripts", JSON.stringify(updated))
  }

  const filteredTranscripts = transcripts.filter((transcript) => {
    const matchesSearch =
      transcript.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transcript.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transcript.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = filterType === "all" || transcript.type === filterType
    const matchesFounder = filterFounder === "all" || transcript.founder === filterFounder

    return matchesSearch && matchesType && matchesFounder && !transcript.isArchived
  })

  const getFounderName = (founderId: string) => {
    const founders: Record<string, string> = {
      "bill-gates": "Bill Gates",
      "elon-musk": "Elon Musk",
      "steve-jobs": "Steve Jobs",
      "jeff-bezos": "Jeff Bezos",
      "mark-zuckerberg": "Mark Zuckerberg",
      "larry-page": "Larry Page",
    }
    return founders[founderId] || "Unknown Founder"
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const downloadTranscript = (transcript: Transcript) => {
    const content = `
FOUNDER COUNSEL CONSULTATION TRANSCRIPT
=====================================

Advisor: ${getFounderName(transcript.founder)}
Type: ${transcript.type === "voice" ? "Voice Call" : "Text Conversation"}
Date: ${transcript.createdAt.toLocaleDateString()}
${transcript.duration ? `Duration: ${formatDuration(transcript.duration)}` : `Messages: ${transcript.messageCount}`}

SUMMARY
-------
${transcript.summary}

FULL TRANSCRIPT
--------------
${transcript.content}

Tags: ${transcript.tags.join(", ")}
Generated by Founder Counsel - Strategic AI Consultation Platform
    `.trim()

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${transcript.title.replace(/[^a-z0-9]/gi, "_")}_transcript.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const viewTranscript = (transcript: Transcript) => {
    setSelectedTranscript(transcript)
    setIsViewModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]">Consultation History</h2>
          <p className="text-muted-foreground">View and manage your strategic consultation transcripts</p>
        </div>
        <Button onClick={onNewConsultation} className="law-firm-hover">
          Start New Consultation
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transcripts, summaries, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "all" | "voice" | "text")}
                className="px-3 py-2 border border-border rounded-md bg-background text-sm"
              >
                <option value="all">All Types</option>
                <option value="voice">Voice Calls</option>
                <option value="text">Text Chats</option>
              </select>

              <select
                value={filterFounder}
                onChange={(e) => setFilterFounder(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-sm"
              >
                <option value="all">All Founders</option>
                <option value="bill-gates">Bill Gates</option>
                <option value="elon-musk">Elon Musk</option>
                <option value="steve-jobs">Steve Jobs</option>
                <option value="jeff-bezos">Jeff Bezos</option>
                <option value="mark-zuckerberg">Mark Zuckerberg</option>
                <option value="larry-page">Larry Page</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcripts List */}
      <div className="grid gap-4">
        {filteredTranscripts.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transcripts Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search terms or filters."
                  : "Start your first consultation to see transcripts here."}
              </p>
              {!searchQuery && (
                <Button onClick={onNewConsultation} variant="outline">
                  Start First Consultation
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTranscripts.map((transcript) => (
            <Card key={transcript.id} className="border-border/50 law-firm-hover group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {transcript.type === "voice" ? (
                          <Phone className="h-4 w-4 text-accent" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-accent" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          {getFounderName(transcript.founder)}
                        </Badge>
                      </div>

                      {transcript.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)] mb-1">
                        {transcript.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{transcript.summary}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {transcript.createdAt.toLocaleDateString()}
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {transcript.duration
                          ? formatDuration(transcript.duration)
                          : `${transcript.messageCount} messages`}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {transcript.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-2 py-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateTranscript(transcript.id, { isStarred: !transcript.isStarred })}
                      className="h-8 w-8 p-0"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          transcript.isStarred ? "text-yellow-500 fill-current" : "text-muted-foreground",
                        )}
                      />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewTranscript(transcript)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadTranscript(transcript)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateTranscript(transcript.id, { isArchived: true })}
                      className="h-8 w-8 p-0"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTranscript(transcript.id)}
                      className="h-8 w-8 p-0 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Transcript Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTranscript && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-[family-name:var(--font-space-grotesk)]">
                  {selectedTranscript.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    {selectedTranscript.type === "voice" ? (
                      <Phone className="h-3 w-3" />
                    ) : (
                      <MessageSquare className="h-3 w-3" />
                    )}
                    {getFounderName(selectedTranscript.founder)}
                  </span>
                  <span>{selectedTranscript.createdAt.toLocaleDateString()}</span>
                  <span>
                    {selectedTranscript.duration
                      ? formatDuration(selectedTranscript.duration)
                      : `${selectedTranscript.messageCount} messages`}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Summary</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedTranscript.summary}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Full Transcript</h4>
                  <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm leading-relaxed whitespace-pre-wrap">{selectedTranscript.content}</pre>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {selectedTranscript.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Button onClick={() => downloadTranscript(selectedTranscript)} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
