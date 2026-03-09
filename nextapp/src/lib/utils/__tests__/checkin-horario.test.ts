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
