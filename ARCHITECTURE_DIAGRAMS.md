# Arquitetura e Diagramas - SaaS VIP List Manager
**Versão:** 1.0
**Data:** 2025-11-23

---

## ÍNDICE
1. [Arquitetura Geral](#arquitetura-geral)
2. [Diagrama de Fluxos](#diagrama-de-fluxos)
3. [Sequência de Operações](#sequência-de-operações)
4. [Componentes Frontend](#componentes-frontend)
5. [Infraestrutura](#infraestrutura)

---

## ARQUITETURA GERAL

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (Mobile-First)            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  Admin Dashboard     │  │  Portaria Check-in App   │    │
│  │  ├─ Event Manager    │  │  ├─ Real-time Search     │    │
│  │  ├─ Guest Lists      │  │  ├─ Quick Check-in       │    │
│  │  ├─ Submissions      │  │  └─ Relatórios           │    │
│  │  └─ Approval Panel   │  │                          │    │
│  └──────────────────────┘  └──────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │  Public Form (sem autenticação)                │        │
│  │  ├─ Event Selection                            │        │
│  │  ├─ Name Submission (textarea)                 │        │
│  │  └─ Success Feedback                           │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
              │
              │ HTTPS + WebSocket (real-time)
              │
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY / Load Balancer              │
│  (Next.js API routes ou Express.js)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │            REST API + WebSocket Server             │    │
│  │                                                    │    │
│  │  Routes:                                          │    │
│  │  ├─ POST   /api/admin/eventos                    │    │
│  │  ├─ POST   /api/admin/eventos/:id/clone          │    │
│  │  ├─ GET    /api/admin/eventos                    │    │
│  │  ├─ POST   /api/submit-names (público)           │    │
│  │  ├─ POST   /api/admin/submissions/:id/approve    │    │
│  │  ├─ GET    /api/portaria/search                  │    │
│  │  ├─ POST   /api/portaria/checkin                 │    │
│  │  └─ GET    /api/portaria/relatorio               │    │
│  │                                                    │    │
│  │  Middleware:                                      │    │
│  │  ├─ Authentication (JWT)                         │    │
│  │  ├─ Rate Limiting                                │    │
│  │  ├─ Validation                                   │    │
│  │  └─ Error Handling                               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
              │
              │ Prepared Statements / ORM
              │
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐  ┌────────────────────┐           │
│  │  PostgreSQL Main   │  │  Redis Cache       │           │
│  │  ├─ eventos_*      │  │  ├─ Sessions       │           │
│  │  ├─ guest_*        │  │  ├─ Rate Limits    │           │
│  │  ├─ check_in_*     │  │  └─ Search Index   │           │
│  │  ├─ boates         │  │                    │           │
│  │  ├─ users          │  │                    │           │
│  │  └─ Índices        │  └────────────────────┘           │
│  └────────────────────┘                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ├─ Email Service (Submissão aprovada)                     │
│  ├─ SMS/Push Notifications (opcional)                      │
│  ├─ Analytics (Mixpanel/Amplitude)                         │
│  └─ Sentry (Error Tracking)                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## DIAGRAMA DE FLUXOS

### Fluxo 1: Criar Evento Recorrente

```
                        ADMIN
                         │
                         │ 1. Acessa Admin Dashboard
                         │
          ┌──────────────┴──────────────┐
          │                             │
    [Novo Evento]             [Clonar Evento Existente]
          │                             │
          │ 2. Preench Form             │ 2. Select Evento
          │    (Nome, Data, Hora)       │ 3. Popup: Quantas semanas?
          │                             │
          │ 3. Submit                   │ 4. Confirma
          │                             │
    ┌─────▼─────────────────────────────▼──────┐
    │       Server: POST /api/admin/eventos    │
    │       ou POST /api/admin/eventos/:id/clone
    │                                          │
    │  Validações:                            │
    │  ├─ Data >= hoje?                       │
    │  ├─ Capacidade > 0?                     │
    │  ├─ Hora válida?                        │
    │  └─ Clones futuro-only?                 │
    │                                          │
    │  Se template:                           │
    │  └─> INSERT eventos_template             │
    │                                          │
    │  Se clone (N semanas):                  │
    │  ├─> FOR i=1 to N                       │
    │  │   data_efetiva = template_date + (i*7) dias
    │  │   INSERT eventos_instancia            │
    │  └─> Cada instância lista vazia
    └─────┬──────────────────────────────────────┘
          │
          │ 5. Resposta: { success, ids[], message }
          │
          ▼
    [Toast: "4 eventos clonados"]
    [Redireciona para lista do evento template]
```

---

### Fluxo 2: Submeter Nomes em Massa

```
                        PROMOTER
                         │
                         │ 1. Acessa URL pública:
                         │    /submit-names?evento_id=XYZ
                         │
          ┌──────────────┴──────────────┐
          │                             │
    [Seleciona Evento]                  │
    └──────┬──────────────┘              │
           │                            │
           │ 2. Vê evento (nome, data) │
           │                           │
           │ 3. Cola texto sujo        │
           │    "🔥 João              │
           │     1- Maria             │
           │     (Carla)              │
           │     pedro"               │
           │                          │
    ┌──────▼──────────────────────────┐
    │ Parse Pipeline (Client-side)    │
    │                                │
    │ Passo 1: Remove emojis        │
    │ Passo 2: Remove números leading
    │ Passo 3: Remove símbolos       │
    │ Passo 4: Trim/normalize spaces │
    │ Passo 5: Title Case            │
    │ Passo 6: Validação básica      │
    │                                │
    │ Output: ["João Silva",         │
    │          "Maria",              │
    │          "Carla",              │
    │          "Pedro"]              │
    └──────┬──────────────────────────┘
           │
           │ 4. Submit POST /api/submit-names
           │
    ┌──────▼──────────────────────────────────────┐
    │ Server: Parse Pipeline (validação real)    │
    │                                              │
    │ ├─ Regex validation                         │
    │ ├─ Min/Max length check                     │
    │ ├─ Detect duplicates (case-insensitive)   │
    │ ├─ Check max 500 names limit                │
    │ ├─ Rate limiting (10 req/hora/IP)          │
    │ └─ Sanitize (SQL injection prevention)     │
    │                                              │
    │ Status: Salva como PENDENTE                 │
    │ Expiração: +24h                             │
    │                                              │
    │ INSERT guest_submissions                    │
    │  (evento_id, raw_text, parsed_names[],     │
    │   status='Pendente', expires_at=+24h)      │
    └──────┬───────────────────────────────────────┘
           │
           │ 5. Resposta: { success, submission_id }
           │
           ▼
    [Toast: "4 nomes recebidos"]
    [Email para Admin: "Nova submissão ABC123"]
    [URL com ID para tracking (opcional)]


              ╔═══════════════════════════════════╗
              ║     ADMIN APPROVES LATER          ║
              ╚═══════════════════════════════════╝

              Admin Dashboard
                    │
                    │ Clica "5 Submissões Pendentes"
                    │
              ┌─────▼──────────┐
              │ Modal: Revisa  │
              │ Nomes          │
              │ Pode remover   │
              │ alguns         │
              └─────┬──────────┘
                    │
                    │ Clica "Aprovar"
                    │
              ┌─────▼─────────────────────────────┐
              │ POST /api/admin/submissions/:id   │
              │         /approve                  │
              │                                   │
              │ FOR cada nome validado:          │
              │  INSERT guest_records             │
              │  (evento_id, nome, tipo,         │
              │   source='Submission',            │
              │   status='Aprovado')             │
              │                                   │
              │ UPDATE guest_submissions         │
              │ status='Aprovado'                │
              │ approved_by=admin_id             │
              └─────┬───────────────────────────────┘
                    │
                    ▼
              [Toast: "4 nomes adicionados"]
```

---

### Fluxo 3: Check-in na Portaria

```
                        PORTARIA (Mobile)
                         │
                         │ Abre tela Check-in
                         │ Vê: Data, Horário Atual
                         │
                         │ 1. Clica campo Busca
                         │ 2. Começa a digitar: "João"
                         │
    ┌────────────────────┴────────────────────┐
    │                                         │
    │  Real-time Search (Debounce 300ms)    │
    │                                         │
    │  GET /api/portaria/search              │
    │      ?q=João                            │
    │      &evento_id=XYZ                    │
    │                                         │
    │  Server: Busca em guest_records       │
    │  (LOWER(nome) LIKE '%joão%')          │
    │                                         │
    │  Response: [{                          │
    │    id: 'abc123',                       │
    │    nome: 'João Silva',                 │
    │    tipo_cliente: 'VIP',                │
    │    horario_limite: '00:30'             │
    │  }]                                     │
    │                                         │
    │  3. Mostra resultados                  │
    │  4. Clica em "João Silva"              │
    │                                         │
    └────────────────────┬────────────────────┘
                         │
         ╔═══════════════▼════════════════╗
         ║  VALIDAÇÃO DE HORÁRIO          ║
         ╚═══════════════╦════════════════╝
                         │
          ┌──────────────┴──────────────┐
          │                             │
       [Tipo = VIP?]               [Tipo = Convidado?]
          │ SIM                         │ SIM
          │                            │
    ┌─────▼─────────────────────┐  ┌──▼──────────────┐
    │ horário_atual <=          │  │ Sem restrição   │
    │ horario_vip_limite        │  │ PERMITIDO       │
    │                           │  │                 │
    │ 00:15 <= 00:30? SIM ✓    │  │ ✓               │
    │ PERMITIDO                 │  └──────┬──────────┘
    │                           │         │
    │ 01:00 <= 00:30? NÃO ✗    │         │
    │ BLOQUEADO                 │         │
    │ Msg: "VIP até 00:30"      │         │
    └─────┬───────────────────────┘       │
          │                               │
          └───────────────┬───────────────┘
                          │
                ┌─────────▼─────────────┐
                │ POST /api/portaria    │
                │     /checkin          │
                │                       │
                │ {                     │
                │  guest_id,            │
                │  evento_id,           │
                │  timestamp_entrada    │
                │ }                     │
                │                       │
                │ Validações:           │
                │ ├─ Guest existe?      │
                │ ├─ No evento?         │
                │ ├─ Horário OK?        │
                │ └─ Nenhum check-in dup
                │                       │
                │ INSERT check_in_*     │
                │ (guest_id, evento_id, │
                │  timestamp,           │
                │  tipo, horarios)      │
                │                       │
                │ BROADCAST WebSocket:  │
                │ "Check-in: João Silva"│
                └─────┬─────────────────┘
                      │
          ╔═══════════▼═══════════╗
          ║  FEEDBACK VISUAL      ║
          ╚═══════════╦═══════════╝
                      │
          ┌───────────┼───────────┐
          │           │           │
     [✓ Verde]  [✗ Vermelho] [⚠ Amarelo]
          │           │           │
    Permitido    Bloqueado   Já entraram
    Som bip      Motivo
    "Bem-vindo!"
          │           │           │
          └───────────┴───────────┘
                      │
                      │ Auto-clear em 2s
                      │ Volta ao campo busca
                      │
                      ▼
              [Pronto para próximo]


        ╔═════════════════════════════════╗
        ║   REAL-TIME SYNC via WebSocket  ║
        ╚═════════════════════════════════╝

        Portaria A                    Portaria B
         │                               │
         │ Check-in: João               │
         │                               │
         └──────────┬──────────────┬─────┘
                    │              │
            Server WebSocket      │
               │                  │
            Broadcast Message     │
               └──────────────────┼─────────
                                  │
                                  ▼
                            [Atualização lista]
                            [Remove João]
```

---

## SEQUÊNCIA DE OPERAÇÕES

### Sequência 1: Clone de Evento Completo

```
Admin           Browser         API Server        Database        Admin Notif
 │                │                │                │                │
 │ 1. Click Clone  │                │                │                │
 ├───────────────►│                │                │                │
 │                │ 2. POST /clone │                │                │
 │                ├───────────────►│                │                │
 │                │                │ 3. Validate    │                │
 │                │                │    Data >= today
 │                │                │                │                │
 │                │                │ 4. SELECT      │                │
 │                │                │    template    │                │
 │                │                ├───────────────►│                │
 │                │                │◄───────────────┤                │
 │                │                │                │                │
 │                │                │ 5. FOR i=1 to N│                │
 │                │                │    INSERT inst │                │
 │                │                ├───────────────►│                │
 │                │                │ ├───INSERT 1───►                │
 │                │                │ ├───INSERT 2───►                │
 │                │                │ ├───INSERT 3───►                │
 │                │                │ ├───INSERT 4───►                │
 │                │                │◄───────────────┤                │
 │                │                │                │                │
 │                │ 6. 200 OK      │                │                │
 │                │◄───────────────┤                │                │
 │                │                │                │                │
 │ 7. Toast       │                │                │                │
 │ "4 clonados"   │                │                │                │
 │◄───────────────┤                │                │                │
 │                │                │                │                │
 │ 8. Redirect    │                │                │ 9. Email notif |
 │ para template  │                │                │◄───────────────┤
 │                │                │                │                │
```

### Sequência 2: Parsing e Aprovação

```
Promoter        Browser      API Server       Database       Admin        Browser
 │                │               │               │            │             │
 │ 1. Paste texto │               │               │            │             │
 ├───────────────►│               │               │            │             │
 │                │ 2. Parse      │               │            │             │
 │                │ (client-side) │               │            │             │
 │                │               │               │            │             │
 │                │ 3. POST       │               │            │             │
 │                │ /submit-names │               │            │             │
 │                ├──────────────►│               │            │             │
 │                │               │ 4. Validate  │            │             │
 │                │               │    Parse     │            │             │
 │                │               │    Sanitize  │            │             │
 │                │               │               │            │             │
 │                │               │ 5. INSERT    │            │             │
 │                │               │ submission   │            │             │
 │                │               ├──────────────►│            │             │
 │                │               │◄──────────────┤            │             │
 │                │               │               │            │             │
 │                │ 6. 200 OK     │               │            │             │
 │                │◄──────────────┤               │            │             │
 │                │               │               │            │             │
 │ 7. Toast OK    │               │               │            │ 8. Email   │
 │◄───────────────┤               │               │            │ notif      │
 │                │               │               │            │◄───────────┤
 │                │               │               │            │            │
 │                │               │               │            │ 9. Open   │
 │                │               │               │            │ Dashboard │
 │                │               │               │            ├───────────►│
 │                │               │               │            │            │
 │                │               │               │            │ 10. See   │
 │                │               │               │            │ Submissions
 │                │               │               │            │            │
 │                │               │               │            │ 11. Click │
 │                │               │               │            │ Approve   │
 │                │               │               │            ├───────────┐│
 │                │               │               │            │           ││
 │                │               │               │   12. POST /approve
 │                │               │               │           ┌────────────►│
 │                │               │ 13. INSERT    │           │            │
 │                │               │ guest_records │           │            │
 │                │               ├──────────────►│           │            │
 │                │               │◄──────────────┤           │            │
 │                │               │               │           │            │
 │                │               │ 14. UPDATE   │           │            │
 │                │               │ submissions  │           │            │
 │                │               ├──────────────►│           │            │
 │                │               │◄──────────────┤           │            │
 │                │               │               │           │            │
 │                │               │ 15. 200 OK    │           │            │
 │                │               │────────────────────────────►            │
 │                │               │               │           │            │
 │                │               │               │           │ 16. Toast │
 │                │               │               │           │ "Aprovado"│
 │                │               │               │           │◄───────────┤
 │                │               │               │           │            │
```

### Sequência 3: Check-in Real-time Sincronizado

```
Portaria A      WebSocket      Portaria B      API Server      Database
 │               │               │                │               │
 │ 1. Search     │               │                │               │
 │ "João"        │               │                │               │
 │               │               │                │               │
 │ 2. Click      │               │                │               │
 │ Result        │               │                │               │
 │               │               │                │               │
 │ 3. POST       │               │                │               │
 │ /checkin      │               │                │               │
 │               ├──────────────►│                │               │
 │               │               │                │               │
 │               │               │ 4. Validate   │               │
 │               │               │                │               │
 │               │               │ 5. INSERT     │               │
 │               │               │ check_in      │               │
 │               │               ├──────────────►│               │
 │               │               │◄──────────────┤               │
 │               │               │                │               │
 │               │ 6. Broadcast │                │               │
 │               │ "João entered"                │               │
 │               │◄──────┬───────►                │               │
 │               │       │       │                │               │
 │ 7. Update     │       │  8. Update            │               │
 │ [Verde + Som] │       │  [Remove João]        │               │
 │◄──────────────┤       │◄───────────────────────               │
 │               │       │                                        │
 │               │       │                                        │
 │ 9. Auto-clear │       │                                        │
 │ in 2s         │       │                                        │
 │               │       │                                        │
```

---

## COMPONENTES FRONTEND

### Admin Dashboard Layout (Mobile)

```
┌───────────────────────────────────┐
│  ☰  Admin Dashboard               │
├───────────────────────────────────┤
│                                   │
│  [+ Novo Evento]  [Ver Modelos]   │
│                                   │
│  EVENTOS PRÓXIMOS                │
│  ┌─────────────────────────────┐ │
│  │ 23/11 - Festa Sábado        │ │
│  │ 23:00-05:00 | 50 VIPs       │ │
│  │ [Listar] [Clonar] [...]     │ │
│  └─────────────────────────────┘ │
│                                   │
│  ┌─────────────────────────────┐ │
│  │ 22/11 - Festa Recorrente    │ │
│  │ 23:00-05:00 | 45 VIPs       │ │
│  │ [Listar] [Clonar] [...]     │ │
│  └─────────────────────────────┘ │
│                                   │
│  5 SUBMISSÕES PENDENTES           │
│  ┌─────────────────────────────┐ │
│  │ ID: ABC123 | 4 nomes        │ │
│  │ IP: 192.168... | 2h atrás   │ │
│  │ [Ver] [Aprovar] [Rejeitar]  │ │
│  └─────────────────────────────┘ │
│                                   │
│  RELATÓRIO RÁPIDO                │
│  ├─ Total VIPs: 450              │
│  ├─ Presentes hoje: 287 (64%)    │
│  └─ Taxa ocupação: ████████░ 85% │
│                                   │
└───────────────────────────────────┘
```

### Portaria Check-in Layout (Mobile)

```
┌───────────────────────────────────┐
│  ◄ Festa 23/11 | 00:45            │
├───────────────────────────────────┤
│                                   │
│  BUSCAR VIP                       │
│  ┌───────────────────────────────┐│
│  │ Digite o nome...              ││
│  └───────────────────────────────┘│
│                                   │
│  RESULTADOS (Real-time)           │
│  ┌────────────────────────────┐  │
│  │ João Silva (VIP)           │  │
│  │ até 00:30                  │  │
│  │ [✓ CHECK-IN]               │  │
│  └────────────────────────────┘  │
│                                   │
│  ┌────────────────────────────┐  │
│  │ João Pedro (Convidado)     │  │
│  │ sem limite                 │  │
│  │ [✓ CHECK-IN]               │  │
│  └────────────────────────────┘  │
│                                   │
│  REGISTROS DE HOJE                │
│  ├─ Total: 142                    │
│  ├─ Agora: 00:45                  │
│  └─ Próxima hora pico: 23:30-00:00
│                                   │
│  [RELATÓRIO] [SETTINGS]           │
│                                   │
└───────────────────────────────────┘
```

### Public Submission Form Layout

```
┌───────────────────────────────────┐
│  Festa 23 de Novembro             │
│  Casa Noturna XYZ                 │
├───────────────────────────────────┤
│                                   │
│  ADICIONE SUA LISTA               │
│                                   │
│  Cole os nomes (um por linha):    │
│  ┌───────────────────────────────┐│
│  │🔥 João Silva                  ││
│  │1- Maria Santos                ││
│  │(Carla Oliveira)               ││
│  │pedro ferreira                 ││
│  │                               ││
│  │                               ││
│  └───────────────────────────────┘│
│  Máximo 500 nomes                 │
│                                   │
│  [Limpar]         [ENVIAR]        │
│                                   │
│  ✓ Parsing automático             │
│  ✓ Remove emojis e números        │
│  ✓ Normaliza maiúsculas           │
│                                   │
│  Enviado com sucesso!             │
│  ┌───────────────────────────────┐│
│  │ ✓ 4 nomes recebidos          ││
│  │                               ││
│  │ ID da Submissão:              ││
│  │ ABC-XYZ-123                   ││
│  │                               ││
│  │ Enviado para aprovação.       ││
│  │ Você receberá notificação.    ││
│  │                               ││
│  │ [Enviar Outra] [Fechar]       ││
│  └───────────────────────────────┘│
│                                   │
└───────────────────────────────────┘
```

---

## INFRAESTRUTURA

### Stack Proposto

```
Frontend:
  ├─ React 18 (ou Next.js 14)
  ├─ TailwindCSS (responsive mobile)
  ├─ Socket.io Client (WebSocket)
  └─ React Query (state management)

Backend:
  ├─ Node.js 20 LTS
  ├─ Express.js ou Next.js API routes
  ├─ Prisma ORM (ou Sequelize)
  ├─ Socket.io (real-time)
  └─ Zod/Joi (validation)

Database:
  ├─ PostgreSQL 15+ (ACID, índices)
  └─ Redis 7+ (cache, rate limiting, sessions)

Infrastructure:
  ├─ Docker (containerização)
  ├─ Docker Compose (local dev)
  ├─ GitHub Actions (CI/CD)
  ├─ AWS/Heroku/Vercel (deploy)
  └─ GitHub (VCS)

Monitoring:
  ├─ Sentry (error tracking)
  ├─ LogRocket (session replay)
  └─ CloudWatch/Datadog (logs)

Security:
  ├─ JWT (authentication)
  ├─ Rate Limiting (redis-based)
  ├─ HTTPS + HSTS
  ├─ CORS (restrictivo)
  └─ Content Security Policy
```

### Deployment Flow

```
GitHub Push
    │
    ▼
GitHub Actions CI
├─ Run tests (Jest)
├─ Lint (ESLint)
├─ Build (TypeScript)
└─ Security scan
    │
    ├─ [PASS] ──────────┐
    │                   │
    ├─ [FAIL] ──────────┼──► Notify Slack
    │                   │
    └─ Deploy to Staging
                    │
                    ▼
              Test in Staging
              (Smoke tests, Manual QA)
                    │
                    ▼
              Deploy to Production
              (Blue-Green ou Canary)
                    │
                    ▼
              Health checks
              (API endpoints)
```

### Scaling Strategy

```
MVP (Fase 1):
  ├─ Single Dyno (Heroku) ou t2.small (AWS)
  ├─ PostgreSQL shared
  └─ Manual deployment

Growth (Fase 2):
  ├─ Horizontal scaling (2-3 instances)
  ├─ Load balancer (ALB/HAProxy)
  ├─ Redis cluster
  └─ Auto-deployment

Enterprise (Fase 3):
  ├─ Kubernetes (EKS/GKE)
  ├─ Database replication
  ├─ CDN para assets
  ├─ Multi-region
  └─ Dedicated ops
```

---

**Documento gerado:** 2025-11-23
**Próxima revisão:** Após Fase 1 de desenvolvimento
