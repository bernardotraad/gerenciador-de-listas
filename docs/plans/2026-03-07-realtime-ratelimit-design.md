# Design: Real-time Check-in + Rate Limiting
**Data:** 2026-03-07
**Status:** Aprovado

## Escopo

Duas features restantes para completar o MVP:
1. **Real-time sync** — múltiplas telas de portaria se sincronizam automaticamente quando um check-in ocorre
2. **Rate limiting** — proteção da rota pública `/api/submit` contra abuso

---

## Feature 1: Real-time com Supabase Realtime

### Abordagem
Subscribe na tabela `check_in_records` via Supabase Realtime. Todos os clientes portaria conectados ao mesmo evento recebem eventos INSERT em < 1s.

### Fluxo
```
Portaria A faz check-in
  → server action insere em check_in_records
  → Supabase emite evento para todos os subscribers do canal
  → Portaria B recebe INSERT e atualiza UI sem reload
```

### Hook: `useRealtimeCheckins`
- Arquivo: `src/hooks/use-realtime-checkins.ts`
- Parâmetro: `eventoInstanciaId: string`
- Retorno: `checkins: CheckinRecord[]`
- Comportamento: subscribe no canal `check_in_records`, filtra por `evento_instancia_id`, on INSERT adiciona ao estado local, cleanup no unmount

### Integração na Portaria
- Página `src/app/portaria/page.tsx` chama o hook com o evento ativo
- Lista de convidados usa os dados do hook para marcar status `Presente`
- Badge "ao vivo" indica conexão Realtime ativa

---

## Feature 2: Rate Limiting in-memory

### Abordagem
Map global em memória com sliding window de 1 hora por IP. Aplicado apenas na rota pública de submissão.

### Implementação
- Arquivo: `src/lib/rate-limit.ts`
- Estrutura: `Map<string, number[]>` — IP → array de timestamps
- Função: `checkRateLimit(ip, limit=10, windowMs=3600000): boolean`
  - Remove timestamps antigos (> windowMs)
  - Se count >= limit → retorna false (bloqueado)
  - Caso contrário → adiciona timestamp atual, retorna true

### Limites
```
POST /api/submit (criarSubmissao): 10 req/hora por IP
```

### Integração
- Aplicado no início da server action `criarSubmissao` em `src/lib/actions/submissoes.ts`
- Se bloqueado: retorna erro com mensagem "Muitas tentativas. Tente novamente em 1 hora."

---

## Fora do Escopo
- Rate limiting no check-in (autenticado, menor risco)
- Real-time no painel admin
- Modo offline / cache local
- Persistência do rate limit entre restarts

---

## Arquivos Modificados
| Arquivo | Mudança |
|---------|---------|
| `src/hooks/use-realtime-checkins.ts` | Novo — hook Supabase Realtime |
| `src/lib/rate-limit.ts` | Novo — função checkRateLimit |
| `src/lib/actions/submissoes.ts` | Modificar — adicionar checkRateLimit |
| `src/app/portaria/page.tsx` | Modificar — integrar useRealtimeCheckins |
