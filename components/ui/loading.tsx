"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingProps {
  text?: string
  size?: "sm" | "md" | "lg"
  className?: string
  fullScreen?: boolean
}

const SIZE_CLASSES = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const

const DEFAULT_TEXT = "Carregando..."
const DEFAULT_SIZE = "md"

const LoadingContent = ({ 
  text = DEFAULT_TEXT, 
  size = DEFAULT_SIZE, 
  className = "" 
}: LoadingProps) => (
  <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
    <Loader2 className={cn("animate-spin", SIZE_CLASSES[size])} />
    {text && (
      <p className="text-sm text-muted-foreground">{text}</p>
    )}
  </div>
)

const Loading = ({ 
  text = DEFAULT_TEXT, 
  size = DEFAULT_SIZE, 
  className = "", 
  fullScreen = false 
}: LoadingProps) => {
  const content = (
    <LoadingContent 
      text={text} 
      size={size} 
      className={className} 
    />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}

const LoadingPage = ({ text }: { text?: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <Loading text={text} size="lg" />
  </div>
)

const LoadingOverlay = ({ text }: { text?: string }) => (
  <Loading text={text} fullScreen />
)

export { Loading, LoadingPage, LoadingOverlay }
export type { LoadingProps }
