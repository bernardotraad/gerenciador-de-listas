"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingProps {
  text?: string
  size?: "sm" | "md" | "lg"
  className?: string
  fullScreen?: boolean
}

export function Loading({ text = "Carregando...", size = "md", className = "", fullScreen = false }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  const containerClasses = fullScreen
    ? "fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
    : "flex flex-col items-center justify-center py-8"

  return (
    <div className={cn(containerClasses, className)}>
      <Loader2 className={cn("animate-spin mb-2", sizeClasses[size])} />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

export function LoadingPage({ text }: { text?: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Loading text={text} size="lg" className="min-h-[400px]" />
    </div>
  )
}

export function LoadingOverlay({ text }: { text?: string }) {
  return <Loading text={text} size="lg" fullScreen />
}
