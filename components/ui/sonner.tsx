"use client"

/*
  Wrapper para a biblioteca `sonner` de notificações.
  Mantém a mesma assinatura utilizada pelo shadcn/ui:
    import { Toaster } from "@/components/ui/sonner"
    import { toast } from "sonner"
*/

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner"

export const Toaster = SonnerToaster
export const toast = sonnerToast
