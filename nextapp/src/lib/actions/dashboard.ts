'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subDays, addDays } from 'date-fns'

async function getBoateId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase
        .from('users')
        .select('boate_id, nome')
        .eq('id', user.id)
        .single()
    return profile
}

// ─── TAB GERAL ────────────────────────────────────────────────────────────────

export async function getDashboardGeral() {
    const supabase = await createClient()
    const profile = await getBoateId()
    if (!profile) return null

    const { boate_id } = profile

    const hoje = new Date()
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
    const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1).toISOString()

    // IDs dos eventos da boate (usado para filtrar tabelas sem boate_id direto)
    const { data: eventosBoate } = await supabase
        .from('eventos_instancia')
        .select('id')
        .eq('boate_id', boate_id)
    const eventoIdsBoate = (eventosBoate ?? []).map(e => e.id)

    // KPIs
    const [
        { count: eventosAtivos },
        { count: convidadosAprovados },
        { count: submissoesPendentes },
        { count: checkinsHoje },
    ] = await Promise.all([
        supabase.from('eventos_instancia').select('*', { count: 'exact', head: true }).eq('boate_id', boate_id).eq('status', 'Ativo').gte('data_efetiva', format(hoje, 'yyyy-MM-dd')),
        eventoIdsBoate.length > 0
            ? supabase.from('guest_records').select('*', { count: 'exact', head: true }).eq('status', 'Aprovado').in('evento_instancia_id', eventoIdsBoate)
            : Promise.resolve({ count: 0 }),
        eventoIdsBoate.length > 0
            ? supabase.from('guest_submissions').select('*', { count: 'exact', head: true }).eq('status', 'Pendente').in('evento_instancia_id', eventoIdsBoate)
            : Promise.resolve({ count: 0 }),
        eventoIdsBoate.length > 0
            ? supabase.from('check_in_records').select('*', { count: 'exact', head: true }).gte('timestamp_entrada', inicioDia).lt('timestamp_entrada', fimDia).in('evento_instancia_id', eventoIdsBoate)
            : Promise.resolve({ count: 0 }),
    ])

    // Check-ins últimos 30 dias
    const inicio30Dias = subDays(hoje, 29).toISOString()
    const checkins30DiasQuery = supabase
        .from('check_in_records')
        .select('timestamp_entrada, evento_instancia_id')
        .gte('timestamp_entrada', inicio30Dias)
        .order('timestamp_entrada', { ascending: true })
    const { data: checkins30Dias } = eventoIdsBoate.length > 0
        ? await checkins30DiasQuery.in('evento_instancia_id', eventoIdsBoate)
        : { data: [] }

    // Agrupa por data
    const checkinsPorDia: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
        const d = format(subDays(hoje, i), 'yyyy-MM-dd')
        checkinsPorDia[d] = 0
    }
    for (const c of checkins30Dias ?? []) {
        const d = c.timestamp_entrada.slice(0, 10)
        if (d in checkinsPorDia) checkinsPorDia[d]++
    }
    const checkinsLinha = Object.entries(checkinsPorDia).map(([data, total]) => ({
        data: format(new Date(data + 'T12:00:00'), 'dd/MM'),
        total,
    }))

    // Funil de submissões
    const submissoesQuery = supabase.from('guest_submissions').select('status')
    const { data: submissoes } = eventoIdsBoate.length > 0
        ? await submissoesQuery.in('evento_instancia_id', eventoIdsBoate)
        : { data: [] }

    const submissoesFunil = { Pendente: 0, Aprovado: 0, Rejeitado: 0 }
    for (const s of submissoes ?? []) {
        if (s.status in submissoesFunil) submissoesFunil[s.status as keyof typeof submissoesFunil]++
    }
    const funilData = [
        { nome: 'Pendentes', total: submissoesFunil.Pendente },
        { nome: 'Aprovadas', total: submissoesFunil.Aprovado },
        { nome: 'Rejeitadas', total: submissoesFunil.Rejeitado },
    ]

    // Check-ins por tipo de lista
    const checkinsTipoQuery = supabase.from('check_in_records').select('lista_tipo_nome')
    const { data: checkinsTipo } = eventoIdsBoate.length > 0
        ? await checkinsTipoQuery.in('evento_instancia_id', eventoIdsBoate)
        : { data: [] }

    const tipoMap: Record<string, number> = {}
    for (const c of checkinsTipo ?? []) {
        const nome = c.lista_tipo_nome || 'Sem tipo'
        tipoMap[nome] = (tipoMap[nome] || 0) + 1
    }
    const tipoData = Object.entries(tipoMap).map(([nome, total]) => ({ nome, total }))

    return {
        kpis: { eventosAtivos, convidadosAprovados, submissoesPendentes, checkinsHoje },
        checkinsLinha,
        funilData,
        tipoData,
        nomeAdmin: profile.nome,
    }
}

// ─── TAB SEMANA ───────────────────────────────────────────────────────────────

export async function getDashboardSemana(semanaInicio: string) {
    const supabase = await createClient()
    const profile = await getBoateId()
    if (!profile) return null

    const { boate_id } = profile

    const inicio = new Date(semanaInicio + 'T00:00:00')
    const fim = addDays(inicio, 6)
    const fimISO = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate() + 1).toISOString()
    const inicioISO = inicio.toISOString()

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    // Eventos da semana (filtrado por boate)
    const fimSemanaDate = format(fim, 'yyyy-MM-dd')
    const inicioSemanaDate = format(inicio, 'yyyy-MM-dd')
    const { data: eventos } = await supabase
        .from('eventos_instancia')
        .select('id, nome, data_efetiva, capacidade, status')
        .eq('boate_id', boate_id)
        .gte('data_efetiva', inicioSemanaDate)
        .lte('data_efetiva', fimSemanaDate)
        .order('data_efetiva', { ascending: true })

    // Check-ins por dia da semana — filtrado pelos eventos da boate nessa semana
    const eventoIdsSemana = (eventos ?? []).map(e => e.id)
    const { data: checkins } = eventoIdsSemana.length > 0
        ? await supabase
            .from('check_in_records')
            .select('timestamp_entrada')
            .gte('timestamp_entrada', inicioISO)
            .lt('timestamp_entrada', fimISO)
            .in('evento_instancia_id', eventoIdsSemana)
        : { data: [] }

    const porDia: number[] = [0, 0, 0, 0, 0, 0, 0]
    for (const c of checkins ?? []) {
        const d = new Date(c.timestamp_entrada).getDay()
        porDia[d]++
    }
    const checkinsDia = diasSemana.map((dia, i) => ({ dia, total: porDia[i] }))

    let eventoCheckins: Record<string, number> = {}
    if (eventoIdsSemana.length > 0) {
        const { data: cks } = await supabase
            .from('check_in_records')
            .select('evento_instancia_id')
            .in('evento_instancia_id', eventoIdsSemana)
        for (const c of cks ?? []) {
            eventoCheckins[c.evento_instancia_id] = (eventoCheckins[c.evento_instancia_id] || 0) + 1
        }
    }

    const eventosData = (eventos ?? []).map(e => ({
        id: e.id,
        nome: e.nome,
        data: format(new Date(e.data_efetiva + 'T12:00:00'), 'dd/MM'),
        capacidade: e.capacidade,
        checkins: eventoCheckins[e.id] || 0,
        ocupacao: e.capacidade ? Math.round(((eventoCheckins[e.id] || 0) / e.capacidade) * 100) : 0,
        status: e.status,
    }))

    return { checkinsDia, eventosData }
}

// ─── TAB MÊS ──────────────────────────────────────────────────────────────────

export async function getDashboardMes(mes: number, ano: number) {
    const supabase = await createClient()
    const profile = await getBoateId()
    if (!profile) return null

    const { boate_id } = profile

    const inicioMes = new Date(ano, mes - 1, 1)
    const fimMes = new Date(ano, mes, 0)
    const inicioISO = inicioMes.toISOString()
    const fimISO = new Date(fimMes.getFullYear(), fimMes.getMonth(), fimMes.getDate() + 1).toISOString()

    // Eventos do mês (filtrado por boate)
    const inicioMesStr = format(inicioMes, 'yyyy-MM-dd')
    const fimMesStr = format(fimMes, 'yyyy-MM-dd')
    const { data: eventos } = await supabase
        .from('eventos_instancia')
        .select('id, nome, data_efetiva, capacidade, status')
        .eq('boate_id', boate_id)
        .gte('data_efetiva', inicioMesStr)
        .lte('data_efetiva', fimMesStr)
        .order('data_efetiva', { ascending: true })

    // Check-ins por semana do mês — filtrado pelos eventos da boate
    const eventoIdsMes = (eventos ?? []).map(e => e.id)
    const { data: checkins } = eventoIdsMes.length > 0
        ? await supabase
            .from('check_in_records')
            .select('timestamp_entrada')
            .gte('timestamp_entrada', inicioISO)
            .lt('timestamp_entrada', fimISO)
            .in('evento_instancia_id', eventoIdsMes)
        : { data: [] }

    // Agrupa por semana do mês (1, 2, 3, 4, 5)
    const porSemana: Record<string, number> = {}
    for (const c of checkins ?? []) {
        const d = new Date(c.timestamp_entrada)
        const semana = Math.ceil(d.getDate() / 7)
        const key = `Semana ${semana}`
        porSemana[key] = (porSemana[key] || 0) + 1
    }
    const checkinsSemanais = Object.entries(porSemana).map(([semana, total]) => ({ semana, total }))
        .sort((a, b) => a.semana.localeCompare(b.semana))

    let eventoCheckins: Record<string, number> = {}
    if (eventoIdsMes.length > 0) {
        const { data: cks } = await supabase
            .from('check_in_records')
            .select('evento_instancia_id')
            .in('evento_instancia_id', eventoIdsMes)
        for (const c of cks ?? []) {
            eventoCheckins[c.evento_instancia_id] = (eventoCheckins[c.evento_instancia_id] || 0) + 1
        }
    }

    const eventosData = (eventos ?? []).map(e => ({
        id: e.id,
        nome: e.nome,
        data: format(new Date(e.data_efetiva + 'T12:00:00'), 'dd/MM'),
        capacidade: e.capacidade,
        checkins: eventoCheckins[e.id] || 0,
        ocupacao: e.capacidade ? Math.round(((eventoCheckins[e.id] || 0) / e.capacidade) * 100) : 0,
        status: e.status,
    }))

    return { checkinsSemanais, eventosData }
}

// ─── TAB EVENTO ───────────────────────────────────────────────────────────────

export async function getDashboardEvento(eventoId: string) {
    const supabase = await createClient()
    const profile = await getBoateId()
    if (!profile) return null

    // Dados do evento
    const { data: evento } = await supabase
        .from('eventos_instancia')
        .select('id, nome, data_efetiva, capacidade, hora_inicio, hora_fim')
        .eq('id', eventoId)
        .single()

    if (!evento) return null

    // Todos os check-ins do evento
    const { data: checkins } = await supabase
        .from('check_in_records')
        .select('timestamp_entrada, lista_tipo_nome, portaria_user_id')
        .eq('evento_instancia_id', eventoId)

    // Por hora
    const porHora: Record<number, number> = {}
    for (let h = 18; h <= 5 + 24; h++) porHora[h % 24] = 0 // 18h até 05h
    for (const c of checkins ?? []) {
        const hora = new Date(c.timestamp_entrada).getHours()
        porHora[hora] = (porHora[hora] || 0) + 1
    }
    // Reorganiza na ordem certa (18h → 23h, 00h → 05h)
    const horasOrdenadas = [...Array.from({ length: 6 }, (_, i) => i + 18), ...Array.from({ length: 6 }, (_, i) => i)]
    const checkinsPorHora = horasOrdenadas
        .filter(h => h in porHora)
        .map(h => ({ hora: `${String(h).padStart(2, '0')}h`, total: porHora[h] || 0 }))

    // Por tipo de lista
    const tipoMap: Record<string, number> = {}
    for (const c of checkins ?? []) {
        const nome = c.lista_tipo_nome || 'Sem tipo'
        tipoMap[nome] = (tipoMap[nome] || 0) + 1
    }
    const tipoData = Object.entries(tipoMap).map(([nome, total]) => ({ nome, total }))

    // Por operador
    const operadorIds = [...new Set((checkins ?? []).map(c => c.portaria_user_id).filter(Boolean))]
    let operadorNomes: Record<string, string> = {}
    if (operadorIds.length > 0) {
        const { data: users } = await supabase
            .from('users')
            .select('id, nome')
            .in('id', operadorIds)
        for (const u of users ?? []) operadorNomes[u.id] = u.nome
    }
    const operadorMap: Record<string, number> = {}
    for (const c of checkins ?? []) {
        if (!c.portaria_user_id) continue
        const nome = operadorNomes[c.portaria_user_id] || 'Desconhecido'
        operadorMap[nome] = (operadorMap[nome] || 0) + 1
    }
    const operadoresData = Object.entries(operadorMap)
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total)

    return {
        evento: {
            nome: evento.nome,
            data: format(new Date(evento.data_efetiva + 'T12:00:00'), 'dd/MM/yyyy'),
            capacidade: evento.capacidade,
            totalCheckins: checkins?.length ?? 0,
            ocupacao: evento.capacidade ? Math.round(((checkins?.length ?? 0) / evento.capacidade) * 100) : 0,
        },
        checkinsPorHora,
        tipoData,
        operadoresData,
    }
}

export async function getEventosDisponiveis() {
    const supabase = await createClient()
    const profile = await getBoateId()
    if (!profile) return []

    const { data: eventos } = await supabase
        .from('eventos_instancia')
        .select('id, nome, data_efetiva, status')
        .eq('boate_id', profile.boate_id)
        .order('data_efetiva', { ascending: false })
        .limit(50)

    return (eventos ?? []).map(e => ({
        id: e.id,
        label: `${e.nome} — ${format(new Date(e.data_efetiva + 'T12:00:00'), 'dd/MM/yyyy')}`,
        status: e.status,
    }))
}
