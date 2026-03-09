# Quick Start - Para Desenvolvedores
**Versão:** 1.0
**Data:** 2025-11-23
**Tempo leitura:** 10 min

---

## ANTES DE COMEÇAR

Se você é desenvolvedor recém-chegado ao projeto, siga este guia para entender a especificação em 30 minutos.

---

## PASSO 1: Leia os 3 Documentos Principais (20 min)

### 1.1 DOCS_BUSINESS_LOGIC.md (10 min)
Foco nas seções:
- **Visão Geral:** O que é o projeto?
- **3 User Stories Core:**
  - US-001: Criar evento
  - US-004: Parse de nomes
  - US-006: Check-in
- **Fluxo 3 (Check-in):** Entender validação horária

### 1.2 ARCHITECTURE_DIAGRAMS.md (5 min)
Foco nas seções:
- **Arquitetura Geral:** Como os sistemas se comunicam?
- **Fluxo 3 (Check-in):** Entender WebSocket + fallback

### 1.3 PARSING_ALGORITHM_SPEC.md (5 min)
Foco nas seções:
- **Pipeline de Limpeza:** 6 passos
- **Implementação TypeScript:** Copiar o código
- **Casos de Teste:** TC001-TC020

---

## PASSO 2: Entenda os 3 Requisitos Core

### Requisito 1: Recorrência (Template vs Instância)

**O que é?**
Admin clona um evento-template (data referência: 15/11) para 4 instâncias:
- 22/11 (15 + 7 dias)
- 29/11 (15 + 14 dias)
- 06/12 (15 + 21 dias)
- 13/12 (15 + 28 dias)

**Tabelas:**
```
eventos_template:
  - id, nome, data_referencia, hora_inicio, hora_fim

eventos_instancia:
  - id, template_id, data_efetiva, semana_numero
  - data_efetiva = data_ref + (semana_numero * 7 dias)
```

**API:**
- `POST /api/admin/eventos` - Criar template
- `POST /api/admin/eventos/:id/clone` - Clonar N semanas

---

### Requisito 2: Parsing Inteligente

**O que é?**
Promoter cola texto sujo. Sistema limpa automaticamente.

**Exemplo:**
```
Input:
🔥 João Silva
1- Maria Santos
(Carla Oliveira)
pedro ferreira

Após parsing (6 passos):
["João Silva", "Maria Santos", "Carla Oliveira", "Pedro Ferreira"]
```

**6 Passos:**
1. Split em linhas
2. Remover emojis
3. Remover numeração (1-, 001., etc)
4. Remover símbolos (manter acentos)
5. Normalizar espaços
6. Title Case

**Validações:**
- Min 2 chars, Max 100 chars
- Padrão: `^[a-zA-ZÀ-ÿ\s\-']+$`
- Sem números
- Deduplicação case-insensitive

**API:**
- `POST /api/submit-names` - Submeter lista (público, sem auth)

**Tabelas:**
```
guest_submissions:
  - id, evento_id, raw_text, parsed_names[], status

guest_records:
  - id, evento_id, nome, tipo_cliente, status
```

---

### Requisito 3: Check-in Real-time

**O que é?**
Portaria busca rápido e valida entrada com sincronização real-time.

**Exemplo:**
```
Portaria digita: "João"
Resultado: ["João Silva (VIP até 00:30)", "João Pedro (Convidado)"]
Clica: "João Silva"
Validação: Horário atual <= 00:30? SIM → Verde ✓
Sincronização: Todas as portarias veem entrada em < 1s
```

**Validação Horária:**
- VIP: Só entra até [hora_vip_limite] (ex: 00:30)
- Convidado: Sem limite
- Server valida, não client

**Sincronização:**
- WebSocket (< 1s ideal)
- Fallback: Polling 2s se WebSocket cair
- Cache local em portaria (offline mode)

**API:**
- `GET /api/portaria/search?q=João&evento_id=XYZ` - Busca
- `POST /api/portaria/checkin` - Fazer check-in
- WebSocket: `/socket.io` (real-time broadcast)

**Tabelas:**
```
check_in_records:
  - id, guest_id, evento_id, timestamp_entrada, tipo_cliente
  - UNIQUE(guest_id, evento_id) - Um check-in por guest
```

---

## PASSO 3: 3 Testes Críticos que Você Deve Fazer

### Teste 1: Parsing Funciona?

```javascript
// Verificar se parsing produz os resultados esperados

Input: "🔥 João Silva\n1- Maria\n@invalid"
Expected: ["João Silva", "Maria"]
Rejected: ["@invalid"]

// Você deve passar em 95%+ dos 20 casos de teste
// Ver: PARSING_ALGORITHM_SPEC.md - Casos de Teste
```

### Teste 2: Recorrência Calcula Datas Corretas?

```javascript
// Verificar se clone calcula datas corretas

Template: 2025-11-15
Clone 4 semanas, esperado:
  - Instancia 1: 2025-11-22 (15 + 7)
  - Instancia 2: 2025-11-29 (15 + 14)
  - Instancia 3: 2025-12-06 (15 + 21)
  - Instancia 4: 2025-12-13 (15 + 28)
```

### Teste 3: Check-in Valida Horário?

```javascript
// Verificar se validação horária funciona

Evento: 23:00 - 05:00
VIP Limite: 00:30

Teste 1: 23:15 + VIP = OK ✓
Teste 2: 00:45 + VIP = BLOQUEADO ✗
Teste 3: 04:00 + Convidado = OK ✓
```

---

## PASSO 4: Estrutura de Pastas Recomendada

```
src/
├── api/
│   ├── admin/
│   │   ├── eventos.ts          ← Criar, listar eventos
│   │   └── clone.ts            ← Clone com recorrência
│   ├── portaria/
│   │   ├── search.ts           ← Busca real-time
│   │   └── checkin.ts          ← Check-in com validação
│   └── submit/
│       └── names.ts            ← Parse + submissão pública
│
├── lib/
│   ├── parsing.ts              ← 6 passos parsing
│   ├── validation.ts           ← Validações (horário, nome)
│   └── utils.ts                ← Helpers
│
├── db/
│   ├── schema.ts               ← Prisma ou SQL schema
│   └── migrations/             ← Scripts DB
│
└── components/
    ├── admin/                  ← UI Admin
    ├── portaria/               ← UI Check-in
    └── public/                 ← Formulário público
```

---

## PASSO 5: 4 Endpoints Principais para Começar

### Endpoint 1: Criar Evento
```
POST /api/admin/eventos
Body: {
  nome: "Festa Sábado",
  data_referencia: "2025-11-15",
  hora_inicio: "23:00",
  hora_fim: "05:00",
  hora_vip_limite: "00:30",
  capacidade: 100,
  tipo_cliente: "VIP"
}
Response: { success, evento_id, message }
```

### Endpoint 2: Clonar Evento
```
POST /api/admin/eventos/ABC123/clone
Body: {
  semanas: 4,
  manter_horarios: true,
  manter_capacidade: true
}
Response: { success, instancia_ids: ["ID1", "ID2", "ID3", "ID4"] }
```

### Endpoint 3: Submeter Nomes
```
POST /api/submit-names (SEM AUTENTICAÇÃO)
Body: {
  evento_id: "XYZ",
  raw_text: "🔥 João Silva\n1- Maria\n(Carla)"
}
Response: {
  success: true,
  submission_id: "ABC-123",
  valid_names: 2,
  rejected: ["(Carla) - motivo"]
}
```

### Endpoint 4: Check-in
```
POST /api/portaria/checkin
Body: {
  guest_id: "GUEST-123",
  evento_id: "XYZ",
  timestamp: 1700700000
}
Response: {
  success: true,
  permitido: true,
  mensagem: "Bem-vindo João!",
  cor: "green"
}
```

---

## PASSO 6: Implementação do Parsing (Copiar e Colar)

```typescript
// lib/parsing.ts
// ATENÇÃO: Use classe explícita de caracteres, NÃO \w (que inclui dígitos)

const ACCENTS = 'àáâãäèéêëìíîïòóôõöùúûüñçÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÑÇ';
const VALID_CHARS_RE = new RegExp(`[^a-zA-Z${ACCENTS}\\s\\-']`, 'g');
const EMOJI_RE = /[\p{Emoji}\p{Emoji_Component}]/gu;
const NUMBERING_RE = /^\s*[\d\s\-\.\:\,]+/;

function parseNames(input: string): { valid: string[]; rejected: Array<{value: string; error: string}> } {
  const lines = input.split(/\r?\n/).filter(l => l.trim());
  const results: { valid: string[]; rejected: Array<{value: string; error: string}> } = { valid: [], rejected: [] };
  const seen = new Set<string>();

  for (const line of lines) {
    let cleaned = line;

    // 1. Remove emojis
    cleaned = cleaned.replace(EMOJI_RE, '');
    // 2. Remove numeração leading (ex: "1- ", "001.")
    cleaned = cleaned.replace(NUMBERING_RE, '');
    // 3. Remove símbolos especiais — sem \w para evitar dígitos residuais
    cleaned = cleaned.replace(VALID_CHARS_RE, '');
    // 4. Normalizar espaços
    cleaned = cleaned.trim().replace(/\s+/g, ' ');
    // 5. Title Case
    cleaned = cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    // 6. Validar
    if (cleaned.length < 2) {
      results.rejected.push({ value: line, error: 'Muito curto' });
    } else if (cleaned.length > 100) {
      results.rejected.push({ value: line, error: 'Muito longo' });
    } else if (/\d/.test(cleaned)) {
      results.rejected.push({ value: line, error: 'Contém números' });
    } else if (seen.has(cleaned.toLowerCase())) {
      results.rejected.push({ value: line, error: 'Duplicado nesta submissão' });
    } else {
      results.valid.push(cleaned);
      seen.add(cleaned.toLowerCase());
    }
  }

  return results;
}
```

---

## PASSO 7: Validação de Horário (com suporte a eventos que cruzam meia-noite)

```typescript
// lib/validation.ts

function validateCheckIn(
  tipo_cliente: 'VIP' | 'Convidado',
  evento: {
    hora_inicio: string;   // ex: "23:00"
    hora_fim: string;      // ex: "05:00"
    hora_vip_limite: string; // ex: "00:30"
    data_efetiva: string;  // ex: "2025-11-15"
  },
  agora: Date = new Date()
): { permitido: boolean; motivo?: string } {

  if (tipo_cliente === 'Convidado') return { permitido: true };

  // Constrói datetime absoluto do limite VIP, considerando meia-noite
  const [limH, limM] = evento.hora_vip_limite.split(':').map(Number);
  const [iniH] = evento.hora_inicio.split(':').map(Number);

  const dataBase = new Date(evento.data_efetiva);
  const limiteVip = new Date(dataBase);
  limiteVip.setHours(limH, limM, 0, 0);

  // Se hora_vip_limite < hora_inicio → o limite é no dia seguinte (cruza meia-noite)
  if (limH < iniH) limiteVip.setDate(limiteVip.getDate() + 1);

  if (agora > limiteVip) {
    return {
      permitido: false,
      motivo: `VIP até ${evento.hora_vip_limite}, agora é ${agora.getHours().toString().padStart(2,'0')}:${agora.getMinutes().toString().padStart(2,'0')}`
    };
  }

  return { permitido: true };
}
```

---

## PASSO 8: Cloudflare Turnstile — Integração (Fase 2)

> ℹ️ Turnstile é invisível para usuários legítimos. Só exibe desafio para atividade suspeita.

### 8.1 Setup

```bash
# Criar conta em dash.cloudflare.com → Turnstile
# Obter: SITE_KEY (public) e SECRET_KEY (server-only)

# .env.local
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
```

### 8.2 Frontend — Formulário Público (`/submit`)

```tsx
// components/public/SubmitForm.tsx
import { Turnstile } from '@marsidev/react-turnstile';

export function SubmitForm({ eventoId }: { eventoId: string }) {
  const [token, setToken] = useState<string | null>(null);

  async function handleSubmit(rawText: string) {
    if (!token) return; // widget ainda não validou

    await fetch('/api/submit-names', {
      method: 'POST',
      body: JSON.stringify({ evento_id: eventoId, raw_text: rawText, turnstile_token: token }),
    });
  }

  return (
    <form>
      <textarea placeholder="Cole os nomes aqui..." />
      {/* Widget invisível — sem atrito para o usuário */}
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={setToken}
        options={{ appearance: 'interaction-only' }}
      />
      <button type="submit">Enviar</button>
    </form>
  );
}
```

### 8.3 Backend — Verificar Token (`/api/submit-names`)

```typescript
// app/api/submit-names/route.ts

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip, // opcional, melhora precisão
    }),
  });
  const data = await res.json();
  return data.success === true;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { evento_id, raw_text, turnstile_token } = await req.json();

  // 1. Verificar Turnstile (Fase 2 — quando habilitado)
  const isHuman = await verifyTurnstile(turnstile_token, ip);
  if (!isHuman) {
    return Response.json({ success: false, error: 'Verificação de segurança falhou' }, { status: 403 });
  }

  // 2. Rate limiting por IP (defesa primária — ativa desde Fase 1)
  // ... Upstash Redis check ...

  // 3. Parsing e inserção
  // ...
}
```

### 8.4 Dependência

```bash
npm install @marsidev/react-turnstile
```

### 8.5 Fallback (MVP — Fase 1 sem Turnstile)

Durante o MVP, remova a verificação do Turnstile e confie apenas no rate limiting por IP. A estrutura de código já está preparada para ativar o Turnstile na Fase 2 sem refactor.

---

## PASSO 9: Executar Localmente (Setup Quick)

### Pré-requisitos:
- Node.js 20+
- Conta Supabase (projeto gratuito em supabase.com)
- Conta Upstash Redis (camada gratuita em upstash.com)

### Comandos:
```bash
# 1. Clonar repo
git clone <repo>
cd gerenciador-de-listas

# 2. Instalar dependências
pnpm install

# 3. Variáveis de ambiente
cp .env.example .env.local
# Preencher: SUPABASE_URL, SUPABASE_ANON_KEY, UPSTASH_REDIS_URL

# 4. Executar migrations SQL no Supabase
# (copiar SQL de DOCS_ARCHITECTURE.md e executar no SQL Editor do Supabase)

# 5. Seed de dados
pnpm run seed

# 6. Iniciar dev server
pnpm run dev
```

---

## PASSO 10: Checklist do Seu Primeiro Sprint (Semana 1)

- [ ] Database criada com 7 tabelas (SQL de DOCS_ARCHITECTURE.md)
- [ ] RLS habilitado por tabela
- [ ] API endpoint `POST /api/admin/eventos` funcionando
- [ ] Validação: Data >= hoje, Capacidade > 0
- [ ] Teste: Criar evento com dados válidos
- [ ] Teste: Rejeitar evento no passado
- [ ] Parsing algorithm implementado (lib/parsing.ts)
- [ ] Testes parsing: TC001-TC020 passando
- [ ] Check-in básico: POST endpoint + validação horária com suporte a meia-noite
- [ ] Teste: VIP permitido no horário
- [ ] Teste: VIP bloqueado fora de horário

---

## PASSO 11: Links de Referência Rápida

| Documento | Seção | Para |
|-----------|-------|------|
| DOCS_BUSINESS_LOGIC.md | Fluxo 2 | Entender parsing |
| DOCS_BUSINESS_LOGIC.md | RN-002 | Validação horária |
| DOCS_BUSINESS_LOGIC.md | RN-010 | Eventos que cruzam meia-noite |
| DOCS_BUSINESS_LOGIC.md | RN-011 | Link público + bootstrap |
| PARSING_ALGORITHM_SPEC.md | Implementação Completa | Copiar código |
| PARSING_ALGORITHM_SPEC.md | Casos de Teste | Testar seu código |
| DOCS_ARCHITECTURE.md | Database Schema | SQL completo |
| IMPLEMENTATION_CHECKLIST.md | Fase 1 | Checklist desenvolvimento |

---

## PERGUNTAS FREQUENTES (DEV)

### P: Por onde começo a desenvolver?
**R:** Fase 1 (IMPLEMENTATION_CHECKLIST.md):
1. Database: 7 tabelas + migrations no Supabase
2. Auth: Supabase Auth + roles (Admin, Portaria)
3. Bootstrap: Script para criar primeiro Admin + Boate
4. API routes: CRUD básico

### P: Como implementar o parsing?
**R:** Copiar `parseNames()` do Passo 6 acima (versão corrigida), adicionar 20 testes TC001-TC020.

### P: Como fazer check-in real-time?
**R:** Socket.io WebSocket para broadcast, fallback polling 2s. Consultar RN-005 em DOCS_BUSINESS_LOGIC.md.

### P: Como lidar com eventos que cruzam meia-noite?
**R:** Usar datetime absoluto no `validateCheckIn()` (Passo 7). Ver RN-010 em DOCS_BUSINESS_LOGIC.md.

### P: Quanto tempo leva cada feature?
**R:** Recorrência (3 dias), Parsing (2 dias), Check-in + WebSocket (4 dias).

### P: Quando ativar o Turnstile?
**R:** Fase 2. Durante o MVP, comentar a chamada `verifyTurnstile()` — a estrutura já está preparada. Ver Passo 8.

---

## RESUMO EXECUTIVO PARA DEV

```
MVP = 3 Features Core em 4 semanas

Semana 0 (Setup — 2 dias):
  └─ Next.js + Supabase + migrations + bootstrap Admin

Semana 1 (Eventos — 5 dias):
  └─ Criar template + Clonar em N semanas + UI Admin

Semana 2 (Parsing — 5 dias):
  └─ Formulário público + pipeline 6 passos + aprovação Admin

Semana 3 (Check-in — 5 dias):
  └─ Busca real-time + validação horária + WebSocket

Semana 4 (Qualidade — 5 dias):
  └─ Testes E2E + performance + deploy staging

Fase 2 (após MVP):
  └─ Turnstile, CSV export, dashboard métricas, modo offline
```

---

**Próximo:** Abra IMPLEMENTATION_CHECKLIST.md e comece pela Semana 0!

