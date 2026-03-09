# Check-in: Validação de Horário VIP — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bloquear check-in de VIPs após `hora_vip_limite` com feedback visual inline (row + Sonner toast).

**Architecture:** Utilitário de comparação de horário com midnight-crossing → server action retorna tipo estruturado → GuestRow exibe badge proativo e feedback pós-ação via useState + Sonner.

**Tech Stack:** Next.js App Router, Supabase server actions, Sonner (já instalado), Vitest (já configurado).

---

### Task 1: Utilitário de validação de horário

**Files:**
- Create: `nextapp/src/lib/utils/checkin-horario.ts`
- Create: `nextapp/src/lib/utils/__tests__/checkin-horario.test.ts`

**Step 1: Criar o arquivo de testes**

```ts
// nextapp/src/lib/utils/__tests__/checkin-horario.test.ts
import { describe, it, expect } from 'vitest'
import { vipDentroDoHorario, formatarHora } from '../checkin-horario'

describe('vipDentroDoHorario — evento cruza meia-noite (23:00–05:00, limite 00:30)', () => {
    const inicio = '23:00:00'
    const limite = '00:30:00'

    it('permite VIP antes do limite (mesma noite, 23:15)', () => {
        const agora = new Date()
        agora.setHours(23, 15, 0, 0)
        expect(vipDentroDoHorario(inicio, limite, agora)).toBe(true)
    })

    it('permite VIP antes do limite (após meia-noite, 00:15)', () => {
        const agora = new Date()
        agora.setHours(0, 15, 0, 0)
        expect(vipDentroDoHorario(inicio, limite, agora)).toBe(true)
    })

    it('permite VIP exatamente no limite (00:30)', () => {
        const agora = new Date()
        agora.setHours(0, 30, 0, 0)
        expect(vipDentroDoHorario(inicio, limite, agora)).toBe(true)
    })

    it('bloqueia VIP 1 minuto após o limite (00:31)', () => {
        const agora = new Date()
        agora.setHours(0, 31, 0, 0)
        expect(vipDentroDoHorario(inicio, limite, agora)).toBe(false)
    })

    it('bloqueia VIP muito após o limite (01:15)', () => {
        const agora = new Date()
        agora.setHours(1, 15, 0, 0)
        expect(vipDentroDoHorario(inicio, limite, agora)).toBe(false)
    })
})

describe('vipDentroDoHorario — evento não cruza meia-noite (20:00–23:00, limite 21:30)', () => {
    const inicio = '20:00:00'
    const limite = '21:30:00'

    it('permite VIP antes do limite (20:45)', () => {
        const agora = new Date()
        agora.setHours(20, 45, 0, 0)
        expect(vipDentroDoHorario(inicio, limite, agora)).toBe(true)
    })

    it('permite VIP exatamente no limite (21:30)', () => {
        const agora = new Date()
        agora.setHours(21, 30, 0, 0)
        expect(vipDentroDoHorario(inicio, limite, agora)).toBe(true)
    })

    it('bloqueia VIP após o limite (21:31)', () => {
        const agora = new Date()
        agora.setHours(21, 31, 0, 0)
        expect(vipDentroDoHorario(inicio, limite, agora)).toBe(false)
    })
})

describe('formatarHora', () => {
    it('remove os segundos de "HH:MM:SS"', () => {
        expect(formatarHora('00:30:00')).toBe('00:30')
        expect(formatarHora('23:00:00')).toBe('23:00')
    })
})
```

**Step 2: Rodar testes para confirmar que falham**

```bash
cd nextapp && pnpm test src/lib/utils/__tests__/checkin-horario.test.ts
```
Esperado: FAIL — `Cannot find module '../checkin-horario'`

**Step 3: Implementar o utilitário**

```ts
// nextapp/src/lib/utils/checkin-horario.ts

function toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
}

/**
 * Retorna true se o horário atual está dentro do limite VIP.
 * Trata eventos que cruzam meia-noite: se hora_vip_limite < hora_inicio,
 * o limite é no dia seguinte (ex: evento 23:00, limite 00:30).
 */
export function vipDentroDoHorario(
    horaInicio: string,
    horaVipLimite: string,
    agora: Date = new Date()
): boolean {
    const inicioMin = toMinutes(horaInicio)
    const limiteMin = toMinutes(horaVipLimite)
    const agoraMin = agora.getHours() * 60 + agora.getMinutes()

    const cruzaMeiaNoite = limiteMin < inicioMin

    if (!cruzaMeiaNoite) {
        return agoraMin <= limiteMin
    }

    // Evento cruza meia-noite: limite está no dia seguinte
    const limiteAjustado = limiteMin + 1440
    const agoraAjustado = agoraMin < inicioMin ? agoraMin + 1440 : agoraMin

    return agoraAjustado <= limiteAjustado
}

/** Formata "HH:MM:SS" como "HH:MM" */
export function formatarHora(time: string): string {
    return time.slice(0, 5)
}
```

**Step 4: Rodar testes para confirmar que passam**

```bash
cd nextapp && pnpm test src/lib/utils/__tests__/checkin-horario.test.ts
```
Esperado: 8 testes PASS

---

### Task 2: Atualizar `fazerCheckin` com validação e tipo de retorno estruturado

**Files:**
- Modify: `nextapp/src/lib/actions/checkin.ts`

**Step 1: Substituir o conteúdo do arquivo**

```ts
// nextapp/src/lib/actions/checkin.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { vipDentroDoHorario, formatarHora } from '@/lib/utils/checkin-horario'

export type CheckinResult =
    | { ok: true }
    | { ok: false; bloqueado: true; motivo: string }
    | { ok: false; jaPresente: true }
    | { ok: false; erro: string }

export async function fazerCheckin(
    guestId: string,
    eventoInstanciaId: string
): Promise<CheckinResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, erro: 'Não autenticado' }

    const { data: evento } = await supabase
        .from('eventos_instancia')
        .select('hora_inicio, hora_fim, hora_vip_limite')
        .eq('id', eventoInstanciaId)
        .single()

    if (!evento) return { ok: false, erro: 'Evento não encontrado' }

    // Verifica se já fez check-in
    const { data: existing } = await supabase
        .from('check_in_records')
        .select('id')
        .eq('guest_id', guestId)
        .eq('evento_instancia_id', eventoInstanciaId)
        .eq('status', 'Presente')
        .maybeSingle()

    if (existing) return { ok: false, jaPresente: true }

    // Busca tipo do convidado
    const { data: guest } = await supabase
        .from('guest_records')
        .select('tipo_cliente')
        .eq('id', guestId)
        .single()

    const tipoCliente = guest?.tipo_cliente ?? 'VIP'

    // Validação de horário VIP
    if (tipoCliente === 'VIP') {
        const permitido = vipDentroDoHorario(evento.hora_inicio, evento.hora_vip_limite)
        if (!permitido) {
            return {
                ok: false,
                bloqueado: true,
                motivo: `VIP permitido até ${formatarHora(evento.hora_vip_limite)}`,
            }
        }
    }

    const { error } = await supabase
        .from('check_in_records')
        .insert({
            guest_id: guestId,
            evento_instancia_id: eventoInstanciaId,
            horario_evento_inicio: evento.hora_inicio,
            horario_evento_fim: evento.hora_fim,
            horario_vip_limite: evento.hora_vip_limite,
            tipo_cliente: tipoCliente,
            portaria_user_id: user.id,
            status: 'Presente',
        })

    if (error) return { ok: false, erro: error.message }

    revalidatePath('/portaria')
    return { ok: true }
}

export async function fazerSaida(checkinId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { error } = await supabase
        .from('check_in_records')
        .update({ status: 'Saida' })
        .eq('id', checkinId)

    if (error) return { error: error.message }

    revalidatePath('/portaria')
    return { success: true }
}
```

**Step 2: Verificar erros de TypeScript**

Usar IDE diagnostics ou `pnpm tsc --noEmit` em `nextapp/`.
Esperado: sem erros.

---

### Task 3: Atualizar `portaria/page.tsx` para passar horários ao `GuestRow`

**Files:**
- Modify: `nextapp/src/app/portaria/page.tsx`

**Step 1: Adicionar `hora_vip_limite` e `hora_inicio` na query e passar para GuestRow**

Localizar a query de `eventos_instancia`:
```ts
// ANTES
.select('id, nome, data_efetiva, hora_inicio, hora_fim, capacidade')

// DEPOIS
.select('id, nome, data_efetiva, hora_inicio, hora_fim, hora_vip_limite, capacidade')
```

Localizar todos os `<GuestRow` no arquivo e adicionar as novas props:
```tsx
// ANTES
<GuestRow
    key={g.id}
    id={g.id}
    nome={g.nome}
    tipo={g.tipo_cliente as 'VIP' | 'Convidado'}
    checkinId={checkinMap[g.id]}
    eventoInstanciaId={eventoAtivo.id}
/>

// DEPOIS (aplicar nos 2 lugares onde GuestRow aparece)
<GuestRow
    key={g.id}
    id={g.id}
    nome={g.nome}
    tipo={g.tipo_cliente as 'VIP' | 'Convidado'}
    checkinId={checkinMap[g.id]}
    eventoInstanciaId={eventoAtivo.id}
    horaVipLimite={eventoAtivo.hora_vip_limite}
    horaInicio={eventoAtivo.hora_inicio}
/>
```

**Step 2: Verificar erros de TypeScript**

Esperado: sem erros (as novas props ainda não existem em GuestRow, então vai dar erro até a Task 4).

---

### Task 4: Atualizar `GuestRow` com badge proativo e feedback pós check-in

**Files:**
- Modify: `nextapp/src/components/checkin/guest-row.tsx`

**Step 1: Substituir o conteúdo do arquivo**

```tsx
// nextapp/src/components/checkin/guest-row.tsx
'use client'

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { fazerCheckin, fazerSaida, type CheckinResult } from '@/lib/actions/checkin'
import { vipDentroDoHorario, formatarHora } from '@/lib/utils/checkin-horario'
import { Loader2, UserCheck, LogOut, Clock } from 'lucide-react'

type GuestTipo = 'VIP' | 'Convidado'

type Feedback =
    | { tipo: 'sucesso' }
    | { tipo: 'bloqueado'; motivo: string }
    | { tipo: 'ja-presente' }

interface GuestRowProps {
    id: string
    nome: string
    tipo: GuestTipo
    checkinId?: string
    eventoInstanciaId: string
    horaVipLimite?: string
    horaInicio?: string
}

const TIPO_STYLE: Record<GuestTipo, string> = {
    VIP: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    Convidado: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
}

export function GuestRow({
    id,
    nome,
    tipo,
    checkinId,
    eventoInstanciaId,
    horaVipLimite,
    horaInicio,
}: GuestRowProps) {
    const [pendingIn, startIn] = useTransition()
    const [pendingOut, startOut] = useTransition()
    const [feedback, setFeedback] = useState<Feedback | null>(null)
    const presente = !!checkinId

    const vipPassouLimite =
        tipo === 'VIP' && horaVipLimite && horaInicio
            ? !vipDentroDoHorario(horaInicio, horaVipLimite)
            : false

    useEffect(() => {
        if (!feedback) return
        const timer = setTimeout(() => setFeedback(null), 3000)
        return () => clearTimeout(timer)
    }, [feedback])

    function handleCheckin() {
        startIn(async () => {
            const result = await fazerCheckin(id, eventoInstanciaId)
            if (result.ok) {
                setFeedback({ tipo: 'sucesso' })
                toast.success(`${nome} — Bem-vindo!`)
            } else if ('jaPresente' in result) {
                setFeedback({ tipo: 'ja-presente' })
                toast.warning(`${nome} já está dentro`)
            } else if ('bloqueado' in result) {
                setFeedback({ tipo: 'bloqueado', motivo: result.motivo })
                toast.error(`Bloqueado: ${result.motivo}`)
            } else {
                toast.error(result.erro)
            }
        })
    }

    function handleSaida() {
        if (!checkinId) return
        startOut(async () => { void fazerSaida(checkinId) })
    }

    const rowBg =
        feedback?.tipo === 'sucesso'
            ? 'bg-emerald-500/10 border-emerald-500/40'
            : feedback?.tipo === 'bloqueado'
            ? 'bg-red-500/10 border-red-500/40'
            : feedback?.tipo === 'ja-presente'
            ? 'bg-amber-500/10 border-amber-500/40'
            : presente
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'

    return (
        <div
            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${rowBg}`}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-semibold ${
                        presente ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                    }`}
                >
                    {nome.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p
                        className={`text-sm font-medium truncate ${
                            presente ? 'text-emerald-300' : 'text-zinc-100'
                        }`}
                    >
                        {nome}
                    </p>

                    {/* Feedback pós check-in */}
                    {feedback?.tipo === 'bloqueado' && (
                        <p className="text-xs text-red-400">{feedback.motivo}</p>
                    )}
                    {feedback?.tipo === 'ja-presente' && (
                        <p className="text-xs text-amber-400">Já está dentro</p>
                    )}

                    {/* Badge proativo de horário VIP (só quando sem feedback e não presente) */}
                    {!presente && !feedback && tipo === 'VIP' && horaVipLimite && (
                        <p
                            className={`text-xs flex items-center gap-1 ${
                                vipPassouLimite ? 'text-red-400' : 'text-zinc-500'
                            }`}
                        >
                            <Clock className="w-3 h-3" />
                            até {formatarHora(horaVipLimite)}
                        </p>
                    )}

                    {/* Status presente (sem feedback ativo) */}
                    {presente && !feedback && (
                        <p className="text-xs text-emerald-500">Presente</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${TIPO_STYLE[tipo]}`}
                >
                    {tipo}
                </span>

                {!presente ? (
                    <button
                        onClick={handleCheckin}
                        disabled={pendingIn}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                        {pendingIn ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                        )}
                        Check-in
                    </button>
                ) : (
                    <button
                        onClick={handleSaida}
                        disabled={pendingOut}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 disabled:opacity-50 transition-colors px-2 py-1.5"
                    >
                        {pendingOut ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <LogOut className="w-3.5 h-3.5" />
                        )}
                        Saída
                    </button>
                )}
            </div>
        </div>
    )
}
```

**Step 2: Verificar diagnósticos de TypeScript**

Esperado: sem erros em `guest-row.tsx`, `checkin.ts` e `portaria/page.tsx`.

**Step 3: Rodar todos os testes**

```bash
cd nextapp && pnpm test
```
Esperado: todos os testes passam (inclui os 21 de parsing + 8 novos de checkin-horario).
