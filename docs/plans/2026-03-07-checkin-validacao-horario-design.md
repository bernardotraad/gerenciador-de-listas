# Design: Validação de Horário no Check-in

**Data:** 2026-03-07
**Status:** Aprovado
**Escopo:** `fazerCheckin`, `GuestRow`, `portaria/page.tsx`

---

## Problema

`fazerCheckin` aceita qualquer check-in sem validar horário. VIPs podem entrar após `hora_vip_limite` sem bloqueio. `GuestRow` ignora o retorno da action com `void`.

---

## Abordagem Escolhida

**Client display + server validates (Abordagem A):**
- `portaria/page.tsx` passa `hora_vip_limite` e `hora_inicio` para `GuestRow`
- `GuestRow` exibe badge VIP proativo com horário limite; badge fica vermelho quando horário atual passa do limite (client-side, apenas visual)
- Botão permanece clicável — servidor é a autoridade final
- `fazerCheckin` retorna resultado estruturado com motivo
- `GuestRow` armazena resultado em `useState` e exibe feedback inline + badge no topo

---

## Server Action (`fazerCheckin`)

### Tipo de retorno

```ts
type CheckinResult =
  | { ok: true }
  | { ok: false; bloqueado: true; motivo: string }
  | { ok: false; jaPresente: true }
  | { ok: false; erro: string }
```

### Lógica de validação de horário (midnight crossing)

Converte horários em minutos desde meia-noite. Para eventos que cruzam meia-noite (`hora_fim < hora_inicio`), horários menores que `hora_inicio` recebem `+1440` para comparação linear.

```
Evento: 23:00 – 05:00, VIP limite: 00:30
hora_inicio = 1380 min
hora_vip_limite = 30 min → ajusta: +1440 → 1470 min
hora_atual = 00:15 = 15 min → < hora_inicio → ajusta: +1440 → 1455 min
Resultado: 1455 <= 1470 → PERMITIDO

hora_atual = 00:31 = 31 min → < hora_inicio → ajusta: +1440 → 1471 min
Resultado: 1471 > 1470 → BLOQUEADO "VIP permitido até 00:30"
```

### Ordem de verificações

1. Evento existe?
2. Guest já fez check-in com `status = 'Presente'`? → `{ ok: false, jaPresente: true }`
3. Busca `tipo_cliente` do guest
4. Se VIP: compara horário atual com `hora_vip_limite` usando lógica de midnight crossing → `{ ok: false, bloqueado: true, motivo: "VIP permitido até HH:MM" }`
5. Insere `check_in_record` → `{ ok: true }`

---

## Componentes

### `portaria/page.tsx`

- Adiciona `hora_vip_limite` e `hora_inicio` na query de `eventos_instancia`
- Passa ambos como props para `GuestRow`

### `GuestRow`

**Novas props:**
```ts
horaVipLimite?: string  // "00:30:00"
horaInicio?: string     // "23:00:00"
```

**Badge proativo (tipo VIP, antes do check-in):**
- Exibe `VIP • até 00:30` abaixo do nome
- Cor cinza normal; vermelho se `Date()` atual > `hora_vip_limite` (cálculo client-side com midnight crossing)

**Estado de feedback (useState):**
```ts
type Feedback =
  | null
  | { tipo: 'sucesso' }
  | { tipo: 'bloqueado'; motivo: string }
  | { tipo: 'ja-presente' }
```

**Comportamento pós check-in:**
- `sucesso` → borda/bg verde, desaparece após 3s
- `bloqueado` → borda vermelha, motivo exibido inline
- `ja-presente` → borda âmbar, "Já está dentro"

**Badge do topo (na portaria/page.tsx ou no próprio GuestRow via portal):**
- `div` fixo abaixo do header da página
- Cor: verde (sucesso), vermelho (bloqueado), âmbar (já presente)
- Some após 3s via `setTimeout`

---

## Fora do escopo

- WebSocket real-time sync
- Bloqueio por `hora_fim` (evento encerrado) — simplificação MVP
- Rate limiting de check-in
