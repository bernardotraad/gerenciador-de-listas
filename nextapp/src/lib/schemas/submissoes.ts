import { z } from 'zod'

export const submissaoSchema = z.object({
    evento_instancia_id: z.string().uuid('ID de evento inválido'),
    lista_tipo_id: z.string().uuid('Selecione um tipo de lista'),
    submitter_label: z.string().min(2, 'Informe seu nome').max(80),
    submitter_email: z.string().email('E-mail inválido').max(120),
    raw_text: z.string().min(1, 'Cole pelo menos um nome'),
})

export type SubmissaoInput = z.infer<typeof submissaoSchema>

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ParseResult {
    names: string[]
    errors: Array<{ value: string; error: string }>
}

// ─── Pipeline (regexes compiladas fora do loop) ──────────────────────────────

// \p{Emoji_Presentation} = emoji displayed as emoji by default (excludes digits 0-9, # and *)
const EMOJI_RE = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu
// Remove leading digits only when followed by non-letter chars (separators/spaces)
// "1- Maria" → removes "1- ", "123João" → no match (J is a letter)
const NUMBERING_RE = /^\s*\d+[^a-zA-ZÀ-ÿ]+/
const ACCENTS = 'àáâãäèéêëìíîïòóôõöùúûüñçÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÑÇ'
// Keep digits in allowed set — Regra 3 (DIGITS_RE) will reject names that still contain them
const SPECIAL_CHARS_RE = new RegExp(`[^a-zA-Z0-9${ACCENTS}\\s\\-']`, 'g')
const TRAILING_DIGITS_RE = /\d+\s*$/
const MULTI_SPACE_RE = /\s+/g
const DIGITS_RE = /\d/
const VALID_PATTERN_RE = /^[a-zA-ZÀ-ÿ\s\-']+$/
// Capitalize first letter after start-of-string, space, hyphen, or apostrophe
const TITLE_CASE_RE = /(^|[ \-'])([a-zA-ZÀ-ÿ])/g

function cleanLine(line: string): string {
    let s = line
    s = s.replace(new RegExp(EMOJI_RE.source, EMOJI_RE.flags), '')
    s = s.replace(NUMBERING_RE, '')
    s = s.replace(new RegExp(SPECIAL_CHARS_RE.source, SPECIAL_CHARS_RE.flags), '')
    s = s.replace(TRAILING_DIGITS_RE, '')
    s = s.trim().replace(MULTI_SPACE_RE, ' ')
    s = s.toLowerCase().replace(TITLE_CASE_RE, (_, sep, char) => sep + char.toUpperCase())
    return s
}

function validateCleaned(cleaned: string): { ok: true; value: string } | { ok: false; error: string } {
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
        const validation = validateCleaned(cleaned)

        if (!validation.ok) {
            errors.push({ value: line.trim(), error: validation.error })
            continue
        }

        const key = validation.value.toLowerCase()
        if (seen.has(key)) continue // duplicata intra-submissão: ignora silenciosamente

        seen.add(key)
        names.push(validation.value)
    }

    return { names, errors }
}
