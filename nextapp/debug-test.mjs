const EMOJI_RE = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu
const NUMBERING_RE = /^\s*\d+[^a-zA-ZÀ-ÿ]+/
const ACCENTS = 'àáâãäèéêëìíîïòóôõöùúûüñçÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÑÇ'
const SPECIAL_CHARS_RE = new RegExp(`[^a-zA-Z0-9${ACCENTS}\\s\\-']`, 'g')
const MULTI_SPACE_RE = /\s+/g
const DIGITS_RE = /\d/
const VALID_PATTERN_RE = /^[a-zA-ZÀ-ÿ\s\-']+$/
const TITLE_CASE_RE = /(^|[ \-'])([a-zA-ZÀ-ÿ])/g

function cleanLine(line) {
    let s = line
    s = s.replace(new RegExp(EMOJI_RE.source, EMOJI_RE.flags), '')
    s = s.replace(NUMBERING_RE, '')
    s = s.replace(new RegExp(SPECIAL_CHARS_RE.source, SPECIAL_CHARS_RE.flags), '')
    s = s.trim().replace(MULTI_SPACE_RE, ' ')
    s = s.toLowerCase().replace(TITLE_CASE_RE, (_, sep, char) => sep + char.toUpperCase())
    return s
}

function validateCleaned(cleaned) {
    if (cleaned.length < 2) return { ok: false, error: 'Mínimo 2 caracteres' }
    if (cleaned.length > 100) return { ok: false, error: 'Máximo 100 caracteres' }
    if (DIGITS_RE.test(cleaned)) return { ok: false, error: 'Números não permitidos' }
    if (!VALID_PATTERN_RE.test(cleaned)) return { ok: false, error: 'Caracteres inválidos' }
    return { ok: true, value: cleaned }
}

const cases = [
    '1- Maria Santos',
    'João123Silva',
    '123João Silva',
    'João Silva123',
]

for (const input of cases) {
    const cleaned = cleanLine(input)
    const validation = validateCleaned(cleaned)
    console.log(`"${input}" → cleaned="${cleaned}" → ${JSON.stringify(validation)}`)
}

// Also test DIGITS_RE stateful issue
console.log('\nDIGITS_RE stateful test (global flag?):')
console.log('DIGITS_RE flags:', DIGITS_RE.flags)
console.log('test João123silva:', DIGITS_RE.test('João123silva'))
console.log('test João123silva again:', DIGITS_RE.test('João123silva'))
console.log('test João Silva:', DIGITS_RE.test('João Silva'))
console.log('test João Silva again:', DIGITS_RE.test('João Silva'))
