import { type NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config"

const BACKEND_URL = config.backendUrl

export async function POST(request: NextRequest) {
  try {
    const { messages, founder, sessionId, originalConsultation, fileCount } = await request.json()

    // Get the last message from the user
    const lastMessage = messages[messages.length - 1]?.content || ""
    
    // Create a contextual query for the Weaviate Query Agent
    const contextualQuery = createContextualQuery(lastMessage, founder, originalConsultation, fileCount)

    // Call the Weaviate Query Agent via your FastAPI backend
    const queryResponse = await fetch(`${BACKEND_URL}/weaviate/query-agent?query=${encodeURIComponent(contextualQuery)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!queryResponse.ok) {
      throw new Error(`Backend query failed: ${queryResponse.status}`)
    }

    const queryResult = await queryResponse.json()
    
    // Format the response as if it's coming from the selected founder
    const founderResponse = formatFounderResponse(queryResult.response, founder, lastMessage)

    return NextResponse.json({ response: founderResponse })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    // Fallback to simulated response if backend is unavailable
    const { messages, founder, sessionId, originalConsultation, fileCount } = await request.json()
    const fallbackResponse = await generateFounderResponse(messages, founder, originalConsultation, fileCount)
    return NextResponse.json({ response: fallbackResponse })
  }
}

// Create a contextual query for the Weaviate Query Agent
function createContextualQuery(
  userMessage: string,
  founder: string,
  originalConsultation: string,
  fileCount: number
): string {
  const founderContext = getFounderContext(founder)
  
  let query = `As ${founderContext.name}, please provide advice on: "${userMessage}"`
  
  if (originalConsultation) {
    query += `\n\nContext from the original consultation: "${originalConsultation}"`
  }
  
  if (fileCount > 0) {
    query += `\n\nNote: The user has uploaded ${fileCount} document(s) that contain relevant business information. Please reference any relevant data from these documents in your response.`
  }
  
  query += `\n\nPlease respond in the style and perspective of ${founderContext.name}, focusing on ${founderContext.focus}.`
  
  return query
}

// Format the Weaviate response as if it's coming from the selected founder
function formatFounderResponse(
  weaviateResponse: string,
  founder: string,
  userMessage: string
): string {
  const founderContext = getFounderContext(founder)
  
  // Add founder-specific framing to the response
  const founderFraming = `As ${founderContext.name}, I'd like to share my perspective on your question about "${userMessage.substring(0, 50)}...":\n\n`
  
  // Add founder-specific closing
  const founderClosing = `\n\nThis approach reflects my experience with ${founderContext.experience}. What specific aspect would you like to explore further?`
  
  return founderFraming + weaviateResponse + founderClosing
}

// Get founder context information
function getFounderContext(founder: string) {
  const contexts: Record<string, { name: string; focus: string; experience: string }> = {
    "bill-gates": {
      name: "Bill Gates",
      focus: "systematic thinking, scalability, and long-term impact",
      experience: "building Microsoft and global philanthropy"
    },
    "elon-musk": {
      name: "Elon Musk", 
      focus: "first principles thinking, rapid iteration, and ambitious goals",
      experience: "leading Tesla, SpaceX, and other breakthrough companies"
    },
    "steve-jobs": {
      name: "Steve Jobs",
      focus: "user experience, design thinking, and product excellence", 
      experience: "creating revolutionary products at Apple"
    },
    "jeff-bezos": {
      name: "Jeff Bezos",
      focus: "customer obsession, long-term thinking, and operational excellence",
      experience: "building Amazon from startup to global platform"
    },
    "mark-zuckerberg": {
      name: "Mark Zuckerberg",
      focus: "connecting people, rapid scaling, and data-driven decisions",
      experience: "growing Facebook and building social platforms"
    },
    "larry-page": {
      name: "Larry Page",
      focus: "organizing information, technical innovation, and moonshot thinking",
      experience: "co-founding Google and Alphabet"
    }
  }
  
  return contexts[founder] || {
    name: "a successful entrepreneur",
    focus: "strategic thinking and execution",
    experience: "building and scaling companies"
  }
}

async function generateFounderResponse(
  messages: any[],
  founder: string,
  originalConsultation: string,
  fileCount: number,
) {
  // This is a simplified simulation - in production, this would call your FastAPI backend
  // which would then use your AI model to generate responses as the selected founder

  const lastMessage = messages[messages.length - 1]?.content || ""

  const founderPersonalities: Record<string, string> = {
    "bill-gates":
      "Focus on systematic thinking, scalability, and long-term impact. Reference Microsoft's growth strategies and philanthropic approaches.",
    "elon-musk":
      "Emphasize first principles thinking, rapid iteration, and ambitious goals. Reference Tesla and SpaceX methodologies.",
    "steve-jobs":
      "Focus on user experience, design thinking, and product excellence. Reference Apple's product development philosophy.",
    "jeff-bezos":
      "Emphasize customer obsession, long-term thinking, and operational excellence. Reference Amazon's principles.",
    "mark-zuckerberg":
      "Focus on connecting people, rapid scaling, and data-driven decisions. Reference Facebook's growth strategies.",
    "larry-page":
      "Emphasize organizing information, technical innovation, and moonshot thinking. Reference Google's approach.",
  }

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

  // This would be replaced with actual AI API call to your FastAPI backend
  const simulatedResponse = `That's an interesting perspective on "${lastMessage.substring(0, 50)}...". ${founderPersonalities[founder] || "Let me share my thoughts on this."} 

Based on my experience, I'd recommend focusing on three key areas: 

1. **Strategic Foundation**: ${getStrategicAdvice(founder)}
2. **Execution Approach**: ${getExecutionAdvice(founder)}  
3. **Long-term Vision**: ${getVisionAdvice(founder)}

${fileCount > 0 ? `I notice you've shared ${fileCount} documents - while I can't review them directly in this format, I'd suggest we discuss the key metrics or challenges highlighted in those materials.` : ""}

What specific aspect of this approach resonates most with your current situation?`

  return simulatedResponse
}

function getStrategicAdvice(founder: string): string {
  const advice: Record<string, string> = {
    "bill-gates": "Start with a clear problem definition and build systematic solutions that can scale globally.",
    "elon-musk":
      "Question every assumption and rebuild from first principles - don't accept 'that's how it's always been done.'",
    "steve-jobs": "Focus obsessively on the user experience and eliminate everything that doesn't serve that goal.",
    "jeff-bezos": "Put the customer at the center of every decision and work backwards from their needs.",
    "mark-zuckerberg":
      "Move fast, test quickly, and let data guide your decisions while maintaining your core mission.",
    "larry-page":
      "Think about how to organize and access information more effectively - that's where breakthrough value lies.",
  }
  return advice[founder] || "Focus on solving real problems with sustainable solutions."
}

function getExecutionAdvice(founder: string): string {
  const advice: Record<string, string> = {
    "bill-gates": "Build strong partnerships and focus on creating platforms that others can build upon.",
    "elon-musk": "Set impossible deadlines and figure out how to achieve them - constraints breed creativity.",
    "steve-jobs": "Say no to 1000 good ideas to focus on the few that can be truly great.",
    "jeff-bezos": "Maintain high standards and be willing to be misunderstood for long periods.",
    "mark-zuckerberg": "Build fast, measure everything, and be ready to pivot based on what you learn.",
    "larry-page": "Hire the smartest people and give them the resources to solve big problems.",
  }
  return advice[founder] || "Execute with discipline while remaining adaptable to change."
}

function getVisionAdvice(founder: string): string {
  const advice: Record<string, string> = {
    "bill-gates": "Think about the positive impact you can have on the world and build towards that future.",
    "elon-musk": "Set goals that seem impossible - if you're not failing sometimes, you're not pushing hard enough.",
    "steve-jobs": "Create products that people don't know they need yet but can't live without once they have them.",
    "jeff-bezos": "Build for the long term and be patient with growth while maintaining urgency in execution.",
    "mark-zuckerberg": "Focus on connecting people and communities - technology should bring us closer together.",
    "larry-page": "Organize the world's information and make it universally accessible and useful.",
  }
  return advice[founder] || "Build something that will matter in 10 years, not just today."
}
