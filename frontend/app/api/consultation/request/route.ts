import { type NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    console.log("\n🚀 ===== FRONTEND CONSULTATION REQUEST =====")
    
    // Parse the form data from the request
    const formData = await request.formData()
    console.log("📝 Parsed form data from request")
    
    const founder = formData.get('founder') as string
    const consultation = formData.get('consultation') as string
    const phoneNumber = formData.get('phoneNumber') as string
    
    console.log(`👤 Founder: ${founder}`)
    console.log(`📞 Phone: ${phoneNumber}`)
    console.log(`💬 Consultation: ${consultation.substring(0, 100)}...`)
    
    // Get uploaded files
    const files: File[] = []
    const pdfFiles: File[] = []
    const imageFiles: File[] = []
    
    console.log("📁 Extracting files from form data...")
    // Extract files from form data
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        files.push(value)
        console.log(`   📄 Found file: ${value.name} (${value.size} bytes, ${value.type})`)
        
        // Categorize files
        if (value.type === 'application/pdf') {
          pdfFiles.push(value)
        } else if (value.type.startsWith('image/')) {
          imageFiles.push(value)
        }
      }
    }
    
    console.log(`📊 File summary: ${files.length} total, ${pdfFiles.length} PDFs, ${imageFiles.length} images`)

    // Create a comprehensive prompt that includes the founder context
    const founderContext = getFounderContext(founder)
    const prompt = `Consultation Request for ${founderContext.name}:

Business Challenge: ${consultation}

Founder Context: ${founderContext.description}
Focus Areas: ${founderContext.focus}

Phone Number: ${phoneNumber}
Timestamp: ${new Date().toISOString()}

Please analyze this consultation request and the uploaded documents to provide comprehensive insights and recommendations.`

    // Prepare form data for the Weaviate process-form endpoint
    const weaviateFormData = new FormData()
    weaviateFormData.append('prompt', prompt)

    // Add PDF files
    pdfFiles.forEach(pdf => {
      weaviateFormData.append('pdfs', pdf)
    })

    // Add image files
    imageFiles.forEach(image => {
      weaviateFormData.append('images', image)
    })

    console.log(`🚀 Sending to Weaviate: ${pdfFiles.length} PDFs, ${imageFiles.length} images`)
    console.log(`🔗 Backend URL: ${config.backendUrl}/weaviate/process-form`)

    // Call the Weaviate process-form endpoint
    console.log("📡 Making request to backend...")
    const backendResponse = await fetch(`${config.backendUrl}/weaviate/process-form`, {
      method: "POST",
      body: weaviateFormData,
    })
    
    console.log(`📊 Backend response status: ${backendResponse.status}`)

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      throw new Error(`Backend request failed: ${backendResponse.status} - ${errorText}`)
    }

    const result = await backendResponse.json()
    console.log("✅ Backend processing completed successfully")
    console.log(`🆔 Session ID: ${result.data?.session_id}`)
    console.log(`💾 Weaviate stored: ${result.weaviate_stored}`)

    return NextResponse.json({
      success: true,
      message: "Consultation processed and stored in Weaviate successfully",
      consultation_id: result.data?.session_id || 'generated-id',
      weaviate_stored: result.weaviate_stored,
      normalized_text: result.data?.normalized_text,
      files_processed: {
        total: files.length,
        pdfs: pdfFiles.length,
        images: imageFiles.length
      }
    })
  } catch (error) {
    console.error("Consultation request error:", error)
    return NextResponse.json({ 
      success: false, 
      message: `Failed to process consultation: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

function getFounderContext(founder: string) {
  const contexts: Record<string, { name: string; description: string; focus: string }> = {
    "bill-gates": {
      name: "Bill Gates",
      description: "Microsoft Co-founder, technology strategist, and philanthropist",
      focus: "systematic thinking, scalability, and long-term impact"
    },
    "elon-musk": {
      name: "Elon Musk", 
      description: "Tesla & SpaceX CEO, innovation leader and disruptor",
      focus: "first principles thinking, rapid iteration, and ambitious goals"
    },
    "mark-zuckerberg": {
      name: "Mark Zuckerberg",
      description: "Meta CEO, social platform builder and growth strategist",
      focus: "connecting people, rapid scaling, and data-driven decisions"
    }
  }
  
  return contexts[founder] || {
    name: "Selected Founder",
    description: "Experienced entrepreneur and business leader",
    focus: "strategic thinking and execution"
  }
}
