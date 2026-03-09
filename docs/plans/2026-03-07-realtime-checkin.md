# Real-time Check-in Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sincronizar automaticamente a tela de portaria entre múltiplos dispositivos quando um check-in ocorre, sem reload manual.

**Architecture:** Um componente cliente `RealtimePortaria` se conecta ao Supabase Realtime e escuta INSERTs na tabela `check_in_records` filtrados pelo evento ativo. Quando recebe um evento, chama `router.refresh()` do Next.js — isso re-executa o Server Component da portaria e atualiza contadores e lista sem precisar gerenciar estado cliente complexo.

**Tech Stack:** Supabase Realtime (`@supabase/supabase-js` channel subscribe), Next.js App Router `useRouter` + `router.refresh()`, React hooks `useEffect`/`useRef`.

**Nota:** Rate limiting já implementado em `src/lib/actions/submissoes.ts` (linhas 22-37) via query no banco por IP. Nada a fazer aqui.

---

## Task 1: Criar componente `RealtimePortaria`

**Files:**
- Create: `nextapp/src/components/checkin/realtime-portaria.tsx`

**Contexto:**
O componente é invisível na tela (ou mostra só um badge "ao vivo"). Ele cria um cliente Supabase no browser, assina o canal `check_in_records` filtrando pelo `evento_instancia_id`, e ao receber INSERT chama `router.refresh()`.

O cliente browser já existe em `src/lib/supabase/client.ts` — usar `createClient()` de lá.

**Step 1: Criar o arquivo**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
    eventoInstanciaId: string
}

export function RealtimePortaria({ eventoInstanciaId }: Props) {
    const router = useRouter()
    const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`checkin-${eventoInstanciaId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'check_in_records',
                    filter: `evento_instancia_id=eq.${eventoInstanciaId}`,
                },
                () => {
                    router.refresh()
                }
            )
            .subscribe()

        channelRef.current = channel

        return () => {
            supabase.removeChannel(channel)
        }
    }, [eventoInstanciaId, router])

    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ao vivo
        </span>
    )
}
```

**Step 2: Verificar que o arquivo foi criado corretamente**

Confirmar que `nextapp/src/components/checkin/realtime-portaria.tsx` existe e não tem erros de TypeScript visíveis.

---

## Task 2: Integrar `RealtimePortaria` na página da portaria

**Files:**
- Modify: `nextapp/src/app/portaria/page.tsx`

**Contexto:**
A página atual é um Server Component. Só precisa importar `RealtimePortaria` e renderizá-lo quando há um evento ativo. O badge "ao vivo" fica no header ao lado do nome do evento.

**Step 1: Adicionar o import no topo do arquivo**

No arquivo `nextapp/src/app/portaria/page.tsx`, após os imports existentes (linha ~6), adicionar:

```tsx
import { RealtimePortaria } from '@/components/checkin/realtime-portaria'
```

**Step 2: Adicionar o componente no header do evento**

Localizar o bloco do header (linha ~73-80):

```tsx
{eventoAtivo && (
    <div className="text-right">
        <p className="text-sm font-semibold text-zinc-200">{eventoAtivo.nome}</p>
        <p className="text-xs text-zinc-500 capitalize">
            {format(new Date(eventoAtivo.data_efetiva + 'T12:00:00'), "EEEE, dd/MM", { locale: ptBR })}
        </p>
    </div>
)}
```

Substituir por:

```tsx
{eventoAtivo && (
    <div className="text-right">
        <div className="flex items-center justify-end gap-2">
            <p className="text-sm font-semibold text-zinc-200">{eventoAtivo.nome}</p>
            <RealtimePortaria eventoInstanciaId={eventoAtivo.id} />
        </div>
        <p className="text-xs text-zinc-500 capitalize">
            {format(new Date(eventoAtivo.data_efetiva + 'T12:00:00'), "EEEE, dd/MM", { locale: ptBR })}
        </p>
    </div>
)}
```

**Step 3: Verificar que a página compila sem erros**

Rodar no diretório `nextapp/`:
```bash
pnpm build
```

Esperado: build sem erros de TypeScript. Se houver erro de tipo no `channelRef`, ajustar o tipo conforme necessário.

---

## Task 3: Habilitar Realtime na tabela no Supabase

**Contexto:**
O Supabase Realtime precisa estar habilitado explicitamente para a tabela `check_in_records`. Isso é feito via dashboard ou SQL.

**Step 1: Executar no Supabase SQL Editor ou via MCP**

```sql
ALTER TABLE check_in_records REPLICA IDENTITY FULL;
```

Depois adicionar a tabela na publicação do Realtime:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE check_in_records;
```

**Step 2: Verificar no Supabase Dashboard**

Em Database → Replication → supabase_realtime, confirmar que `check_in_records` aparece na lista.

---

## Verificação Final

1. Abrir `/portaria` em dois navegadores/abas diferentes
2. Fazer check-in em um deles (clicar em um convidado)
3. Observar que o outro atualiza automaticamente (contadores mudam, convidado aparece como presente) em < 2s
4. O badge "ao vivo" com ponto pulsando deve aparecer no header do evento

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `nextapp/src/components/checkin/realtime-portaria.tsx` | Criar |
| `nextapp/src/app/portaria/page.tsx` | Modificar (import + JSX) |
| Supabase: `check_in_records` | Habilitar Realtime via SQL |
