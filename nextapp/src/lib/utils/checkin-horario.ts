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
