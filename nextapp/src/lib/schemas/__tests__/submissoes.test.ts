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

    it('TC011: rejeita linha só com símbolos', () => {
        const r = parseNomes('@@@')
        expect(r.names).toHaveLength(0)
        expect(r.errors).toHaveLength(1)
    })

    it('TC012: rejeita número no meio do nome', () => {
        const r = parseNomes('João123Silva')
        expect(r.names).toHaveLength(0)
        expect(r.errors[0].error).toMatch(/[Nn]úmero/)
    })

    it('TC013: remove dígitos colados no início e aceita o nome', () => {
        const r = parseNomes('123João Silva')
        expect(r.names).toEqual(['João Silva'])
        expect(r.errors).toHaveLength(0)
    })

    it('TC019: rejeita nome com mais de 100 chars', () => {
        const r = parseNomes('A'.repeat(101))
        expect(r.names).toHaveLength(0)
        expect(r.errors[0].error).toMatch(/100/)
    })

    it('TC020: remove dígitos no final e aceita o nome', () => {
        const r = parseNomes('João Silva123')
        expect(r.names).toEqual(['João Silva'])
        expect(r.errors).toHaveLength(0)
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
