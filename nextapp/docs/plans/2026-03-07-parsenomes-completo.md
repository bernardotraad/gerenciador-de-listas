# parseNomes() Completo — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Substituir a implementação trivial de `parseNomes()` por um pipeline completo de 6 passos com validação, e exibir preview em tempo real de nomes válidos e rejeitados no formulário público.

**Architecture:** A função `parseNomes()` em `lib/schemas/submissoes.ts` muda de retornar `string[]` para retornar `{ names: string[], errors: Array<{ value: string; error: string }> }`. Os dois callers (submit-form e server action) são atualizados para usar a nova assinatura.

**Tech Stack:** TypeScript puro, Vitest para testes, React state para preview em tempo real.

---

### Task 1: Instalar e configurar Vitest

Sem framework de testes atualmente. Vitest é a melhor escolha — zero config com TypeScript e ES modules.

**Files:**
- Modify: `nextapp/package.json`
- Create: `nextapp/vitest.config.ts`

**Step 1: Instalar Vitest**

```bash
cd nextapp
pnpm add -D vitest
```

**Step 2: Criar config mínima**

Crie `nextapp/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
    },
})
```

**Step 3: Adicionar script no package.json**

Em `nextapp/package.json`, adicione na seção `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Verificar que funciona**

```bash
cd nextapp
pnpm test
```

Esperado: `No test files found` (sem erro de configuração).

---

### Task 2: Escrever os testes para parseNomes()

**Files:**
- Create: `nextapp/src/lib/schemas/__tests__/submissoes.test.ts`

**Step 1: Criar o arquivo de testes**

Crie `nextapp/src/lib/schemas/__tests__/submissoes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parseNomes } from '../submissoes'

describe('parseNomes()', () => {
    // ── Nomes válidos ──────────────────────────────────────────────────────

    it('TC001: nome limpo passa direto', () => {
        const r = parseNomes('João Silva')
        expect(r.names).toEqual(['João Silva'])
        expect(r.errors).toHaveLength(0)
    })

    it('TC002: remove emoji leading', () => {
        const r = parseNomes('🔥 João Silva')
        expect(r.names).toEqual(['João Silva'])
        expect(r.errors).toHaveLength(0)
    })

    it('TC003: remove numeração "1-"', () => {
        const r = parseNomes('1- Maria Santos')
        expect(r.names).toEqual(['Maria Santos'])
    })

    it('TC003b: remove numeração "001."', () => {
        const r = parseNomes('001. Carlos')
        expect(r.names).toEqual(['Carlos'])
    })

    it('TC004: remove parênteses', () => {
        const r = parseNomes('(Carla Oliveira)')
        expect(r.names).toEqual(['Carla Oliveira'])
    })

    it('TC005: aplica title case', () => {
        const r = parseNomes('pedro ferreira')
        expect(r.names).toEqual(['Pedro Ferreira'])
    })

    it('TC006: mantém hífen e apóstrofo', () => {
        const r = parseNomes("Jean-Paul O'Brien")
        expect(r.names).toEqual(["Jean-Paul O'Brien"])
    })

    it('TC007: normaliza maiúsculas mistas', () => {
        const r = parseNomes('josé DE oliveira')
        expect(r.names).toEqual(['José De Oliveira'])
    })

    it('TC008: normaliza espaços extras', () => {
        const r = parseNomes('  joão  silva  ')
        expect(r.names).toEqual(['João Silva'])
    })

    it('TC014: aceita umlaut (Müller)', () => {
        const r = parseNomes('Müller')
        expect(r.names).toEqual(['Müller'])
    })

    it('TC015: remove ponto final', () => {
        const r = parseNomes('José Pereira da Silva Jr.')
        expect(r.names).toEqual(['José Pereira Da Silva Jr'])
    })

    // ── Rejeitados ─────────────────────────────────────────────────────────

    it('TC009: rejeita nome com 1 char após limpeza', () => {
        const r = parseNomes('X')
        expect(r.names).toHaveLength(0)
        expect(r.errors[0].error).toMatch(/2 caracteres/)
    })

    it('TC010: rejeita linha só com emojis', () => {
        const r = parseNomes('🔥🔥🔥')
        expect(r.names).toHaveLength(0)
        expect(r.errors).toHaveLength(1)
    })

    it('TC011: rejeita símbolos após limpeza que sobram', () => {
        // "@Maria#Santos" → após remoção de especiais → "MariaSantos" → válido
        // mas "@@@" → "" → mínimo 2 → rejeitado
        const r = parseNomes('@@@')
        expect(r.names).toHaveLength(0)
        expect(r.errors).toHaveLength(1)
    })

    it('TC012: rejeita número no meio do nome', () => {
        const r = parseNomes('João123Silva')
        expect(r.names).toHaveLength(0)
        expect(r.errors[0].error).toMatch(/[Nn]úmero/)
    })

    it('TC013: rejeita dígito colado a letra (não removido pelo passo 3)', () => {
        const r = parseNomes('123João Silva')
        expect(r.names).toHaveLength(0)
        expect(r.errors[0].error).toMatch(/[Nn]úmero/)
    })

    it('TC019: rejeita nome com mais de 100 chars', () => {
        const r = parseNomes('A'.repeat(101))
        expect(r.names).toHaveLength(0)
        expect(r.errors[0].error).toMatch(/100/)
    })

    it('TC020: rejeita número no final', () => {
        const r = parseNomes('João Silva123')
        expect(r.names).toHaveLength(0)
        expect(r.errors[0].error).toMatch(/[Nn]úmero/)
    })

    // ── Ignorados ──────────────────────────────────────────────────────────

    it('TC016: ignora linhas vazias silenciosamente', () => {
        const r = parseNomes('\n\n\n')
        expect(r.names).toHaveLength(0)
        expect(r.errors).toHaveLength(0)
    })

    // ── Deduplicação ───────────────────────────────────────────────────────

    it('TC017: remove duplicatas na mesma submissão', () => {
        const r = parseNomes('João Silva\nJoão Silva')
        expect(r.names).toEqual(['João Silva'])
    })

    it('TC018: deduplicação case-insensitive', () => {
        const r = parseNomes('josé\nJOSÉ\nJosé')
        expect(r.names).toEqual(['José'])
    })

    // ── Multi-linha ────────────────────────────────────────────────────────

    it('processa múltiplas linhas, mix de válidos e rejeitados', () => {
        const input = [
            '🔥 João Silva',
            '1- Maria Santos',
            '(Carla Oliveira)',
            'pedro ferreira',
            "Jean-Paul O'Brien",
            '🔥🔥🔥',
            '123',
        ].join('\n')

        const r = parseNomes(input)
        expect(r.names).toEqual([
            'João Silva',
            'Maria Santos',
            'Carla Oliveira',
            'Pedro Ferreira',
            "Jean-Paul O'Brien",
        ])
        expect(r.errors).toHaveLength(2)
    })
})
```

**Step 2: Rodar os testes — confirmar que falham**

```bash
cd nextapp
pnpm test
```

Esperado: todos os testes falham com `TypeError: r.names is not iterable` ou similar (pois `parseNomes` retorna `string[]` atualmente).

---

### Task 3: Implementar parseNomes() completo

**Files:**
- Modify: `nextapp/src/lib/schemas/submissoes.ts`

**Step 1: Substituir o conteúdo de submissoes.ts**

```typescript
import { z } from 'zod'

export const submissaoSchema = z.object({
    evento_instancia_id: z.string().uuid('ID de evento inválido'),
    submitter_label: z.string().max(80).optional(),
    raw_text: z.string().min(1, 'Cole pelo menos um nome'),
})

export type SubmissaoInput = z.infer<typeof submissaoSchema>

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ParseResult {
    names: string[]
    errors: Array<{ value: string; error: string }>
}

// ─── Pipeline (regexes compiladas fora do loop) ──────────────────────────────

const EMOJI_RE = /[\p{Emoji}\p{Emoji_Component}]/gu
const NUMBERING_RE = /^\s*[\d\s\-\.\:\,]+/
const ACCENTS = 'àáâãäèéêëìíîïòóôõöùúûüñçÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÑÇ'
const SPECIAL_CHARS_RE = new RegExp(`[^a-zA-Z${ACCENTS}\\s\\-']`, 'g')
const MULTI_SPACE_RE = /\s+/g
const DIGITS_RE = /\d/
const VALID_PATTERN_RE = /^[a-zA-ZÀ-ÿ\s\-']+$/

function cleanLine(line: string): string {
    let s = line
    s = s.replace(EMOJI_RE, '')
    s = s.replace(NUMBERING_RE, '')
    s = s.replace(SPECIAL_CHARS_RE, '')
    s = s.trim().replace(MULTI_SPACE_RE, ' ')
    s = s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    return s
}

function validateCleaned(cleaned: string, original: string): { ok: true; value: string } | { ok: false; error: string } {
    if (cleaned.length < 2) return { ok: false, error: 'Mínimo 2 caracteres' }
    if (cleaned.length > 100) return { ok: false, error: 'Máximo 100 caracteres' }
    if (DIGITS_RE.test(cleaned)) return { ok: false, error: 'Números não permitidos' }
    if (!VALID_PATTERN_RE.test(cleaned)) return { ok: false, error: 'Caracteres inválidos' }
    return { ok: true, value: cleaned }
}

/** Parseia texto multi-linha em nomes válidos + lista de rejeitados com motivo */
export function parseNomes(raw: string): ParseResult {
    const lines = raw.split(/\r?\n/)
    const names: string[] = []
    const errors: Array<{ value: string; error: string }> = []
    const seen = new Set<string>()

    for (const line of lines) {
        if (line.trim().length === 0) continue

        const cleaned = cleanLine(line)
        const validation = validateCleaned(cleaned, line)

        if (!validation.ok) {
            errors.push({ value: line.trim(), error: validation.error })
            continue
        }

        const key = validation.value.toLowerCase()
        if (seen.has(key)) continue  // duplicata intra-submissão: ignora silenciosamente

        seen.add(key)
        names.push(validation.value)
    }

    return { names, errors }
}
```

**Step 2: Rodar os testes**

```bash
cd nextapp
pnpm test
```

Esperado: todos os testes passam.

---

### Task 4: Atualizar o server action

**Files:**
- Modify: `nextapp/src/lib/actions/submissoes.ts` (linha ~31)

**Step 1: Trocar uso de parseNomes()**

A linha atual:
```typescript
const nomes = parseNomes(data.raw_text)
if (nomes.length === 0) return { error: 'Nenhum nome válido encontrado.' }
```

Substituir por:
```typescript
const { names: nomes } = parseNomes(data.raw_text)
if (nomes.length === 0) return { error: 'Nenhum nome válido encontrado.' }
```

O restante da função permanece igual (já usa `nomes` como array de strings).

**Step 2: Verificar que não há erros de TypeScript**

```bash
cd nextapp
pnpm exec tsc --noEmit
```

Esperado: sem erros.

---

### Task 5: Atualizar o formulário com preview em tempo real

**Files:**
- Modify: `nextapp/src/components/submissoes/submit-form.tsx`

**Step 1: Atualizar o import e uso de parseNomes()**

A linha atual usa:
```typescript
const nomes = parseNomes(rawText)
```

Substituir por:
```typescript
const { names: nomes, errors: parseErrors } = parseNomes(rawText)
```

**Step 2: Adicionar o bloco de preview abaixo do textarea**

Localizar onde está:
```tsx
<p className="text-zinc-600 text-xs mt-1">Um nome por linha.</p>
```

Substituir por:
```tsx
<p className="text-zinc-600 text-xs mt-1">Um nome por linha.</p>

{/* Preview de parsing */}
{rawText.trim().length > 0 && (
    <div className="mt-3 space-y-2">
        {nomes.length > 0 && (
            <div className="text-xs text-emerald-400">
                ✓ {nomes.length} nome{nomes.length !== 1 ? 's' : ''} válido{nomes.length !== 1 ? 's' : ''}
            </div>
        )}
        {parseErrors.length > 0 && (
            <div className="space-y-1">
                <p className="text-xs text-red-400">✗ {parseErrors.length} rejeitado{parseErrors.length !== 1 ? 's' : ''}:</p>
                <ul className="space-y-0.5">
                    {parseErrors.map((e, i) => (
                        <li key={i} className="text-xs text-red-400/80">
                            &ldquo;{e.value}&rdquo; — {e.error}
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
)}
```

**Step 3: Verificar TypeScript**

```bash
cd nextapp
pnpm exec tsc --noEmit
```

Esperado: sem erros.

**Step 4: Verificar visualmente**

Iniciar o servidor de dev:
```bash
cd nextapp
pnpm dev
```

Acessar `/submit?evento_id=<qualquer-uuid>` e testar na textarea:
```
🔥 João Silva
1- Maria Santos
123João
X
pedro ferreira
```

Esperado no preview:
- `✓ 3 nomes válidos`
- `✗ 2 rejeitados:`
  - `"123João" — Números não permitidos`
  - `"X" — Mínimo 2 caracteres`

---

## Checklist final

- [ ] Vitest instalado e configurado
- [ ] Todos os testes de TC001–TC020 passando
- [ ] `pnpm exec tsc --noEmit` sem erros
- [ ] Preview aparece em tempo real no form `/submit`
- [ ] Nomes com emoji/numeração aparecem limpos (sem indicar transformação)
- [ ] Rejeitados aparecem com motivo claro
- [ ] Botão desabilitado quando `nomes.length === 0`
