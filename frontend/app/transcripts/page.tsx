"use client"

import { TranscriptManager } from "@/components/transcript-manager"
import { AnimatedBackground } from "@/components/animated-background"
import { CursorFollower } from "@/components/cursor-follower"
import { ScrollProgress } from "@/components/scroll-progress"
import { FloatingElements } from "@/components/floating-elements"
import { Scale, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function TranscriptsPage() {
  const router = useRouter()

  const handleNewConsultation = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background relative">
      <AnimatedBackground />
      <FloatingElements />
      <CursorFollower />
      <ScrollProgress />

      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-2">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div className="p-2 bg-primary rounded-lg transform hover:rotate-12 transition-transform duration-300">
                <Scale className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] text-foreground">
                  Founder Counsel
                </h1>
                <p className="text-sm text-muted-foreground">Transcript Management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 relative z-10">
        <TranscriptManager onNewConsultation={handleNewConsultation} />
      </main>
    </div>
  )
}
