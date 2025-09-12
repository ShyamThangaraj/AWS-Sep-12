"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Founder {
  id: string
  name: string
  company: string
  expertise: string[]
  era: string
  description: string
}

const founders: Founder[] = [
  {
    id: "bill-gates",
    name: "Bill Gates",
    company: "Microsoft",
    expertise: ["Software", "Scaling", "Philanthropy"],
    era: "1975-2008",
    description: "Visionary who built the world's largest software company and revolutionized personal computing.",
  },
  {
    id: "elon-musk",
    name: "Elon Musk",
    company: "Tesla, SpaceX",
    expertise: ["Innovation", "Manufacturing", "Vision"],
    era: "1995-Present",
    description: "Serial entrepreneur pushing the boundaries of electric vehicles, space exploration, and AI.",
  },
  {
    id: "steve-jobs",
    name: "Steve Jobs",
    company: "Apple",
    expertise: ["Design", "Marketing", "Product"],
    era: "1976-2011",
    description:
      "Master of product design and marketing who created some of the world's most beloved consumer products.",
  },
  {
    id: "jeff-bezos",
    name: "Jeff Bezos",
    company: "Amazon",
    expertise: ["E-commerce", "Logistics", "Customer Focus"],
    era: "1994-2021",
    description: "Built the world's largest e-commerce platform with relentless focus on customer satisfaction.",
  },
  {
    id: "mark-zuckerberg",
    name: "Mark Zuckerberg",
    company: "Meta (Facebook)",
    expertise: ["Social Media", "Growth", "Networking"],
    era: "2004-Present",
    description: "Connected billions of people worldwide and pioneered the social media revolution.",
  },
  {
    id: "larry-page",
    name: "Larry Page",
    company: "Google",
    expertise: ["Search", "AI", "Information"],
    era: "1998-Present",
    description: "Co-founded Google and organized the world's information to make it universally accessible.",
  },
]

interface FounderSelectorProps {
  selectedFounder: string
  onFounderSelect: (founderId: string) => void
}

export function FounderSelector({ selectedFounder, onFounderSelect }: FounderSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {founders.map((founder) => (
        <Card
          key={founder.id}
          className={cn(
            "cursor-pointer transition-all duration-300 law-firm-hover border-border/50",
            "hover:border-accent/50 hover:shadow-md",
            selectedFounder === founder.id && "border-accent bg-accent/5 shadow-md",
          )}
          onClick={() => onFounderSelect(founder.id)}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold font-[family-name:var(--font-space-grotesk)] text-foreground">
                  {founder.name}
                </h4>
                <p className="text-sm text-muted-foreground">{founder.company}</p>
                <p className="text-xs text-muted-foreground">{founder.era}</p>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{founder.description}</p>

              <div className="flex flex-wrap gap-1">
                {founder.expertise.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs px-2 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
