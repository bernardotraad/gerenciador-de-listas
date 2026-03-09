# Rate Limiting — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Limitar a 10 submissões por IP por hora no formulário público `/submit`.

**Architecture:** Dentro de `criarSubmissao`, capturar o IP via `headers()`, contar submissões recentes desse IP em `guest_submissions`, bloquear se >= 10. Também passa a salvar `submission_ip` no insert (campo já existia mas estava `null`).

**Tech Stack:** Next.js server actions, `next/headers`, Supabase JS client, Vitest.

---

### Task 1: Adicionar rate limiting a `criarSubmissao`

**Files:**
- Modify: `nextapp/src/lib/actions/submissoes.ts`

**Contexto:** `criarSubmissao` é uma server action pública (sem auth). O campo `submission_ip` já existe na tabela `guest_submissions` mas o insert atual não o preenche. A tabela já tem `created_at` com default `now()`.

**Step 1: Ler o arquivo atual**

Leia `nextapp/src/lib/actions/submissoes.ts` para entender o estado atual antes de modificar.

**Step 2: Adicionar import de `headers`**

No topo do arquivo, após os imports existentes, adicionar:
```ts
import { headers } from 'next/headers'
```

**Step 3: Adicionar captura de IP e check de rate limit**

Dentro de `criarSubmissao`, logo após a validação do schema (`if (!parsed.success)...`) e antes da query do evento, inserir:

```ts
// Rate limiting: máx 10 submissões por IP por hora
const headersList = await headers()
const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown'

const umHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString()
const { count } = await supabase
    .from('guest_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('submission_ip', ip)
    .gte('created_at', umHoraAtras)

if ((count ?? 0) >= 10) {
    return { error: 'Limite de 10 submissões por hora atingido. Tente novamente mais tarde.' }
}
```

Nota: o `supabase` neste ponto ainda não foi declarado — o bloco de rate limit deve vir APÓS a declaração do `supabase = createServiceClient()`. A ordem correta no arquivo é:
1. Validação do schema
2. `const supabase = createServiceClient()`
3. Rate limit check (IP + count query)
4. Validação do evento
5. parseNomes
6. Insert

**Step 4: Adicionar `submission_ip` ao insert**

Localizar o objeto passado ao `.insert({...})` e adicionar:
```ts
submission_ip: ip,
```

O insert final deve ser:
```ts
const { error } = await supabase
    .from('guest_submissions')
    .insert({
        evento_instancia_id: data.evento_instancia_id,
        submitter_label: data.submitter_label || null,
        raw_text: data.raw_text,
        parsed_names: nomes,
        status: 'Pendente',
        submission_ip: ip,
    })
```

**Step 5: Verificar TypeScript**

Usar `mcp__ide__getDiagnostics` para:
`file:///d:/Documentos/GitHub/gerenciador-de-listas/nextapp/src/lib/actions/submissoes.ts`

Esperado: zero erros.

**Step 6: Rodar todos os testes**

```bash
cd /d/Documentos/GitHub/gerenciador-de-listas/nextapp && pnpm test --run 2>&1
```

Esperado: mesmos resultados de antes (30 pass, 1 fail pré-existente em TC013). Nenhum teste novo quebrado.

**Step 7: Confirmar o arquivo final completo**

O arquivo `submissoes.ts` completo após as mudanças deve ser:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { submissaoSchema, parseNomes, type SubmissaoInput } from '@/lib/schemas/submissoes'

// ─── Pública (anon) ──────────────────────────────────────────────────────────

export async function criarSubmissao(input: SubmissaoInput) {
    const parsed = submissaoSchema.safeParse(input)
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message }
    }
    const data = parsed.data

    const supabase = createServiceClient()

    // Rate limiting: máx 10 submissões por IP por hora
    const headersList = await headers()
    const ip =
        headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        headersList.get('x-real-ip') ??
        'unknown'

    const umHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
        .from('guest_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('submission_ip', ip)
        .gte('created_at', umHoraAtras)

    if ((count ?? 0) >= 10) {
        return { error: 'Limite de 10 submissões por hora atingido. Tente novamente mais tarde.' }
    }

    // Valida que o evento existe e está ativo
    const { data: evento } = await supabase
        .from('eventos_instancia')
        .select('id, status')
        .eq('id', data.evento_instancia_id)
        .eq('status', 'Ativo')
        .single()

    if (!evento) return { error: 'Evento não encontrado ou inativo.' }

    const nomes = parseNomes(data.raw_text)
    if (nomes.length === 0) return { error: 'Nenhum nome válido encontrado.' }

    const { error } = await supabase
        .from('guest_submissions')
        .insert({
            evento_instancia_id: data.evento_instancia_id,
            submitter_label: data.submitter_label || null,
            raw_text: data.raw_text,
            parsed_names: nomes,
            status: 'Pendente',
            submission_ip: ip,
        })

    if (error) return { error: error.message }

    return { success: true, count: nomes.length }
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function aprovarSubmissao(id: string, notes?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { data: sub } = await supabase
        .from('guest_submissions')
        .select('id, evento_instancia_id, parsed_names')
        .eq('id', id)
        .single()

    if (!sub) return { error: 'Submissão não encontrada' }

    const nomes = (sub.parsed_names as string[]) ?? []

    if (nomes.length > 0) {
        const records = nomes.map((nome) => ({
            evento_instancia_id: sub.evento_instancia_id,
            submission_id: sub.id,
            nome,
            tipo_cliente: 'VIP' as const,
            source: 'Submission' as const,
            status: 'Aprovado' as const,
            added_by: user.id,
        }))

        const { error: recErr } = await supabase
            .from('guest_records')
            .insert(records)

        if (recErr) return { error: recErr.message }
    }

    const { error } = await supabase
        .from('guest_submissions')
        .update({
            status: 'Aprovado',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            approval_notes: notes ?? null,
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/submissoes')
    return { success: true }
}

export async function rejeitarSubmissao(id: string, notes: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { error } = await supabase
        .from('check_in_records')
        .update({ status: 'Saida' })
        .eq('id', id)

    const { error: subError } = await supabase
        .from('guest_submissions')
        .update({
            status: 'Rejeitado',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            approval_notes: notes,
        })
        .eq('id', id)

    if (subError) return { error: subError.message }

    revalidatePath('/admin/submissoes')
    return { success: true }
}
```

Atenção: use o arquivo final acima apenas como referência. Prefira fazer edits cirúrgicos ao invés de substituir o arquivo inteiro, para não perder mudanças existentes.
