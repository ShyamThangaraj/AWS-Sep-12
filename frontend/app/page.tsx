"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/file-upload"
import { AnimatedBackground } from "@/components/animated-background"
import { CursorFollower } from "@/components/cursor-follower"
import { ScrollProgress } from "@/components/scroll-progress"
import { FloatingElements } from "@/components/floating-elements"
import { BackendTest } from "@/components/backend-test"
import { ClientOnly } from "@/components/client-only"
import { Scale, FileText, Phone, History, Sparkles, ArrowRight, CheckCircle, Settings } from "lucide-react"
import Link from "next/link"

type Step = "input" | "recommendations" | "phone"

export default function HomePage() {
  const [step, setStep] = useState<Step>("input")
  const [consultation, setConsultation] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [selectedFounder, setSelectedFounder] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const founders = [
    {
      id: "bill-gates",
      name: "Bill Gates",
      title: "Microsoft Co-founder",
      expertise: "Technology Strategy & Philanthropy",
      description: "Strategic thinking, scaling technology companies, and global impact initiatives",
    },
    {
      id: "elon-musk",
      name: "Elon Musk",
      title: "Tesla & SpaceX CEO",
      expertise: "Innovation & Disruption",
      description: "Revolutionary thinking, sustainable technology, and ambitious goal achievement",
    },
    {
      id: "mark-zuckerberg",
      name: "Mark Zuckerberg",
      title: "Meta CEO",
      expertise: "Social Platforms & Growth",
      description: "Building social networks, user engagement, and platform scaling strategies",
    },
  ]

  const handleInputSubmit = () => {
    if (consultation.trim()) {
      setStep("recommendations")
    }
  }

  const handleFounderSelect = (founderId: string) => {
    setSelectedFounder(founderId)
    setStep("phone")
  }

  const handleCallRequest = async () => {
    if (!phoneNumber.trim() || !selectedFounder || !consultation.trim()) return

    setIsSubmitting(true)

    try {
      console.log("🚀 Starting form submission...")
      console.log("📝 Form data:", { selectedFounder, consultation: consultation.substring(0, 50), phoneNumber })
      console.log("📁 Uploaded files:", uploadedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })))

      // Create FormData to properly send files
      const formData = new FormData()
      formData.append('founder', selectedFounder)
      formData.append('consultation', consultation)
      formData.append('phoneNumber', phoneNumber)
      
      // Add uploaded files to FormData with proper categorization
      uploadedFiles.forEach((file) => {
        console.log(`📄 Adding file: ${file.name} (${file.type})`)
        if (file.type === 'application/pdf') {
          formData.append('pdfs', file)
          console.log(`   ✅ Added as PDF`)
        } else if (file.type.startsWith('image/')) {
          formData.append('images', file)
          console.log(`   ✅ Added as image`)
        } else {
          // For other file types, append with generic name
          formData.append('files', file)
          console.log(`   ✅ Added as generic file`)
        }
      })

      console.log("📡 Making API request to /api/consultation/request...")
      const response = await fetch("/api/consultation/request", {
        method: "POST",
        body: formData, // Don't set Content-Type header, let browser set it with boundary
      })
      
      console.log("📊 Response status:", response.status)

      const result = await response.json()
      console.log("📋 Response result:", result)

      if (response.ok && result.success) {
        console.log("✅ Form submission successful!")
        console.log("🆔 Session ID:", result.consultation_id)
        console.log("📁 Files processed:", result.files_processed)
        console.log("💾 Weaviate stored:", result.weaviate_stored)
        
        // Reset form and show success
        setStep("input")
        setConsultation("")
        setUploadedFiles([])
        setSelectedFounder("")
        setPhoneNumber("")
        
        // Show detailed success message
        const message = `Consultation processed successfully!
        
Session ID: ${result.consultation_id}
Files Processed: ${result.files_processed?.total || 0} (${result.files_processed?.pdfs || 0} PDFs, ${result.files_processed?.images || 0} images)
Stored in Weaviate: ${result.weaviate_stored ? 'Yes' : 'No'}

Your consultation has been processed by Gemini AI and stored in the Weaviate database for future reference.`
        
        alert(message)
      } else {
        console.log("❌ Form submission failed!")
        console.log("📊 Response status:", response.status)
        console.log("📋 Error result:", result)
        throw new Error(result.message || 'Failed to process consultation')
      }
    } catch (error) {
      console.error("❌ Failed to submit consultation:", error)
      console.error("📋 Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      alert(`Failed to submit consultation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      console.log("🏁 Form submission completed, setting isSubmitting to false")
      setIsSubmitting(false)
    }
  }

  const isPhoneValid = phoneNumber.length >= 10

  // Debug function to test form submission
  const testFormSubmission = async () => {
    console.log("🧪 Testing form submission...")
    console.log("📝 Current form state:", {
      selectedFounder,
      consultation: consultation.substring(0, 50),
      phoneNumber,
      uploadedFiles: uploadedFiles.length
    })
    
    if (!phoneNumber.trim() || !selectedFounder || !consultation.trim()) {
      console.log("❌ Form validation failed - missing required fields")
      return
    }
    
    console.log("✅ Form validation passed, calling handleCallRequest...")
    await handleCallRequest()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background relative">
      <ClientOnly>
        <AnimatedBackground />
        <FloatingElements />
        <CursorFollower />
        <ScrollProgress />
      </ClientOnly>

      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg transform hover:rotate-12 transition-transform duration-300">
                <Scale className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] text-foreground">
                  Founder Counsel
                </h1>
                <p className="text-sm text-muted-foreground">Strategic AI Consultation</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/transcripts">
                <Button variant="outline" size="sm" className="law-firm-hover bg-transparent">
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </Link>
              <Badge variant="secondary" className="font-medium hover:scale-105 transition-transform duration-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Historical Wisdom
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <section className="py-16 px-6 relative z-10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-space-grotesk)] text-balance mb-6 animate-fade-in">
            Consult with
            <span className="text-accent bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              {" "}
              Legendary Founders
            </span>
          </h2>
          <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto animate-fade-in-delay">
            Access the strategic wisdom of history's greatest entrepreneurs through our AI-powered consultation
            platform. Share your challenge and receive personalized guidance.
          </p>

          <div className="grid grid-cols-3 gap-8 mb-12 max-w-md mx-auto">
            {[
              { value: "3", label: "Legendary Founders" },
              { value: "24/7", label: "Availability" },
              { value: "100%", label: "Confidential" },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="text-center transform hover:scale-110 transition-all duration-300 cursor-pointer animate-float"
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                <div className="text-2xl font-bold text-accent hover:text-accent/80 transition-colors">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {step === "input" && (
            <Card className="magnetic-hover border-border/50 shadow-lg backdrop-blur-sm bg-card/80 animate-glow">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">
                  Describe Your Challenge
                </CardTitle>
                <CardDescription className="text-base">
                  Share your business challenge or strategic question to get personalized recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)] flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-accent animate-pulse" />
                    Your Business Challenge
                  </h3>
                  <Textarea
                    placeholder="Describe your business challenge, strategic question, or situation you'd like to discuss. Be as detailed as possible to get the most valuable insights..."
                    value={consultation}
                    onChange={(e) => setConsultation(e.target.value)}
                    className="min-h-32 resize-none border-border/50 focus:border-accent/50 transition-all duration-300 focus:shadow-lg shimmer-effect"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
                    Supporting Documents (Optional)
                  </h3>
                  <FileUpload onFilesChange={setUploadedFiles} uploadedFiles={uploadedFiles} />
                </div>

                <div className="flex justify-center pt-6">
                  <Button
                    onClick={handleInputSubmit}
                    disabled={!consultation.trim()}
                    size="lg"
                    className="h-14 px-8 text-lg font-medium bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 transform hover:scale-105 transition-all duration-300 ripple-effect"
                  >
                    Get Recommendations
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "recommendations" && (
            <Card className="magnetic-hover border-border/50 shadow-lg backdrop-blur-sm bg-card/80">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">
                  Recommended Advisors
                </CardTitle>
                <CardDescription className="text-base">
                  Based on your challenge, here are our top founder recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {founders.map((founder, index) => (
                    <Card
                      key={founder.id}
                      className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-border/50 group animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => handleFounderSelect(founder.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] group-hover:text-accent transition-colors">
                                {founder.name}
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                Recommended
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{founder.title}</p>
                            <p className="text-sm font-medium text-accent mb-2">{founder.expertise}</p>
                            <p className="text-sm text-muted-foreground">{founder.description}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === "phone" && (
            <Card className="magnetic-hover border-border/50 shadow-lg backdrop-blur-sm bg-card/80">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-[family-name:var(--font-space-grotesk)]">
                  Schedule Your Call
                </CardTitle>
                <CardDescription className="text-base">
                  Enter your phone number to receive a call from {founders.find((f) => f.id === selectedFounder)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-muted/50 rounded-lg p-4 mb-6">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span className="font-medium">
                      Selected: {founders.find((f) => f.id === selectedFounder)?.name}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)] flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-accent animate-pulse" />
                    Your Phone Number
                  </h3>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="text-lg h-12 border-border/50 focus:border-accent/50 transition-all duration-300"
                  />
                </div>

                <div className="flex justify-center gap-4 pt-6">
                  <Button variant="outline" onClick={() => setStep("recommendations")} size="lg" className="h-14 px-6">
                    Back
                  </Button>
                  <Button
                    onClick={handleCallRequest}
                    disabled={!isPhoneValid || isSubmitting}
                    size="lg"
                    className="h-14 px-8 text-lg font-medium bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 transform hover:scale-105 transition-all duration-300 ripple-effect"
                  >
                    {isSubmitting ? "Requesting Call..." : "Request Call"}
                    <Phone className="h-5 w-5 ml-2" />
                  </Button>
                </div>
                
                {/* Debug button - remove this in production */}
                <div className="flex justify-center pt-4">
                  <Button 
                    variant="secondary" 
                    onClick={testFormSubmission}
                    size="sm"
                    className="text-xs"
                  >
                    🧪 Debug Form Submission
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section className="py-16 px-6 bg-muted/30 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)] text-center mb-12">
            Why Choose Founder Counsel?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Scale,
                title: "Historical Wisdom",
                description:
                  "Access insights from legendary entrepreneurs who built the world's most successful companies.",
              },
              {
                icon: Phone,
                title: "Personal Consultation",
                description:
                  "Receive personalized advice through direct phone conversations tailored to your specific challenges.",
              },
              {
                icon: FileText,
                title: "Document Analysis",
                description: "Upload business documents for comprehensive analysis and strategic recommendations.",
              },
            ].map((feature, index) => (
              <Card
                key={feature.title}
                className="magnetic-hover border-border/50 backdrop-blur-sm bg-card/80 group cursor-pointer animate-float"
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-accent mb-2 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                  <CardTitle className="font-[family-name:var(--font-space-grotesk)] group-hover:text-accent transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 px-6 relative z-10 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-muted-foreground">
            © 2024 Founder Counsel. Confidential AI-powered strategic consultation platform.
          </p>
        </div>
      </footer>
    </div>
  )
}
