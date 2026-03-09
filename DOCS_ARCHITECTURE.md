# TECHNICAL ARCHITECTURE DOCUMENTATION
**VIP List Manager SaaS - Mobile-First Event Management Platform**

**Version:** 2.0
**Date:** 2025-11-23
**Status:** Ready for Implementation
**Last Updated By:** Staff Software Engineer / Tech Lead

---

## TABLE OF CONTENTS

1. [Executive Architecture Summary](#executive-architecture-summary)
2. [Technology Stack Definition](#technology-stack-definition)
3. [System Architecture](#system-architecture)
4. [Database Schema & Design](#database-schema--design)
5. [API Architecture](#api-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Real-time Architecture](#real-time-architecture)
8. [Security Architecture](#security-architecture)
9. [Performance & Scalability](#performance--scalability)
10. [DevOps & Infrastructure](#devops--infrastructure)
11. [Folder Structure](#folder-structure)
12. [Implementation Roadmap](#implementation-roadmap)

---

## EXECUTIVE ARCHITECTURE SUMMARY

### Project Overview

A mobile-first SaaS platform for nightclub VIP list management with three core capabilities:

1. **Event Recurrence System** - Template-based event cloning with automatic weekly scheduling
2. **Intelligent Name Parsing** - 6-step pipeline processing 500+ messy names with 95%+ accuracy
3. **Real-time Check-in** - Sub-second validation with temporal rules and multi-device synchronization

### Architectural Principles

1. **Mobile-First** - 375px viewport priority, touch-optimized (44px+ targets)
2. **Performance** - P95 latency: Search <100ms, Check-in <500ms, Sync <1s
3. **Scalability** - Design for 200+ venues, 5,000+ daily check-ins
4. **Reliability** - 99.5%+ uptime with graceful offline degradation
5. **Security** - Zero-trust, role-based access, public endpoint isolation

### Critical Technical Decisions

| Decision | Chosen | Rejected | Rationale |
|----------|--------|----------|-----------|
| **Frontend Framework** | Next.js 14 (App Router) | Remix, Astro | SSR, RSC, excellent TypeScript, Vercel ecosystem |
| **Database** | PostgreSQL 15+ (Supabase) | MongoDB, MySQL | ACID compliance, excellent indexing, JSON support |
| **Real-time** | WebSocket + Polling fallback | Server-Sent Events | Bidirectional, proven at scale, mobile reliability |
| **UI Framework** | Shadcn/ui + Tailwind CSS | Material UI, Ant Design | Customizable, lightweight, modern DX |
| **State Management** | React Query + Zustand | Redux, MobX | Server state separation, minimal boilerplate |
| **Authentication** | Supabase Auth | NextAuth, Auth0 | Integrated with DB, row-level security |
| **Deployment** | Vercel + Supabase | AWS, self-hosted | Zero-config, automatic scaling, global edge |

---

## TECHNOLOGY STACK DEFINITION

### Core Stack (MVP)

```typescript
{
  "frontend": {
    "framework": "Next.js 14.2.0+",
    "language": "TypeScript 5.3.0+",
    "styling": "Tailwind CSS 3.4.0+",
    "components": "Shadcn/ui (Radix UI primitives)",
    "forms": "React Hook Form 7.x + Zod 3.x",
    "icons": "Lucide React 0.x",
    "theme": "next-themes 0.x"
  },
  "backend": {
    "runtime": "Node.js 20 LTS",
    "framework": "Next.js API Routes",
    "database": "PostgreSQL 15+ (via Supabase)",
    "auth": "Supabase Auth",
    "realtime": "Socket.io 4.x",
    "validation": "Zod 3.x",
    "orm": "Prisma 5.x (optional, Supabase has client)"
  },
  "infrastructure": {
    "hosting": "Vercel (frontend + API)",
    "database": "Supabase (PostgreSQL + Auth + Storage)",
    "cdn": "Vercel Edge Network",
    "cache": "Upstash Redis (rate limiting)",
    "monitoring": "Vercel Analytics + Sentry",
    "ci_cd": "GitHub Actions"
  },
  "development": {
    "package_manager": "pnpm 9.x",
    "linting": "ESLint 9.x + Prettier 3.x",
    "testing": "Vitest 1.x + Playwright 1.x",
    "git_hooks": "Husky 9.x + lint-staged 15.x"
  }
}
```

### Dependency Versioning Strategy

```json
{
  "strategy": "locked_minor",
  "rules": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0"
  },
  "update_policy": {
    "major": "manual_review",
    "minor": "automatic_ci",
    "patch": "automatic"
  }
}
```

---

## SYSTEM ARCHITECTURE

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Edge)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  Admin Dashboard │  │  Doorstaff App   │  │  Public Form  │ │
│  │  (Desktop/Tablet)│  │  (Mobile)        │  │  (Mobile)     │ │
│  │                  │  │                  │  │  (No Auth)    │ │
│  │  - Event Manager │  │  - Real-time     │  │  - Name       │ │
│  │  - Approvals     │  │    Search        │  │    Submission │ │
│  │  - Analytics     │  │  - Check-in      │  │  - Parsing    │ │
│  │  - Settings      │  │  - Validation    │  │    Preview    │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│           │                     │                      │         │
└───────────┼─────────────────────┼──────────────────────┼─────────┘
            │                     │                      │
            │   HTTPS/WSS         │   HTTPS/WSS          │   HTTPS
            │                     │                      │
┌───────────▼─────────────────────▼──────────────────────▼─────────┐
│                    API LAYER (Vercel Edge)                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Next.js API Routes                            │ │
│  │                                                            │ │
│  │  Authenticated:                 Public:                   │ │
│  │  ├─ POST /api/admin/events      ├─ POST /api/submit-names │ │
│  │  ├─ POST /api/admin/clone       └─ GET  /api/events/info │ │
│  │  ├─ GET  /api/admin/submissions                           │ │
│  │  ├─ POST /api/admin/approve                               │ │
│  │  ├─ GET  /api/portaria/search                             │ │
│  │  ├─ POST /api/portaria/checkin                            │ │
│  │  └─ GET  /api/portaria/report                             │ │
│  │                                                            │ │
│  │  Middleware Stack:                                        │ │
│  │  ├─ CORS (restrictive)                                    │ │
│  │  ├─ Rate Limiting (Upstash Redis)                         │ │
│  │  ├─ Authentication (Supabase JWT)                         │ │
│  │  ├─ Authorization (Role-based)                            │ │
│  │  ├─ Validation (Zod schemas)                              │ │
│  │  ├─ Error Handling (Sentry)                               │ │
│  │  └─ Logging (Vercel Analytics)                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            WebSocket Server (Socket.io)                    │ │
│  │                                                            │ │
│  │  Rooms: evento_id based                                   │ │
│  │  Events: checkin:new, checkin:exit, list:updated         │ │
│  │  Fallback: Long polling (2s interval)                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            │   Pooled Connections
                            │
┌───────────────────────────▼───────────────────────────────────────┐
│                    DATA LAYER (Supabase)                          │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL 15+ (Primary Database)              │ │
│  │                                                              │ │
│  │  Tables (7):                                                │ │
│  │  ├─ eventos_template (event templates)                     │ │
│  │  ├─ eventos_instancia (cloned instances)                   │ │
│  │  ├─ guest_records (VIP names per event)                    │ │
│  │  ├─ guest_submissions (pending approvals)                  │ │
│  │  ├─ check_in_records (entry logs)                          │ │
│  │  ├─ boates (venue master data)                             │ │
│  │  └─ users (authentication & roles)                         │ │
│  │                                                              │ │
│  │  Indexes: 15+ (optimized for search, filtering, joins)    │ │
│  │  Constraints: Foreign keys, unique, check constraints      │ │
│  │  Row-Level Security: Enabled (role-based data isolation)   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │               Supabase Realtime (Change Data Capture)       │ │
│  │  Triggers: ON INSERT check_in_records                       │ │
│  │  Broadcast: To connected WebSocket clients                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  Upstash Redis  │  │    Sentry    │  │  Vercel Analytics   │ │
│  │  Rate Limiting  │  │  Error Track │  │  Performance        │ │
│  └─────────────────┘  └──────────────┘  └──────────────────────┘ │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

#### Flow 1: Event Creation with Recurrence

```
Admin (Browser)
      │
      │ 1. POST /api/admin/events (template data)
      ▼
Next.js API Route
      │
      │ 2. Validate (Zod schema)
      │ 3. Authenticate (Supabase JWT)
      │ 4. Authorize (role = admin)
      ▼
Supabase DB
      │
      │ 5. INSERT eventos_template
      │ 6. RETURNING id
      ▼
Next.js API Route
      │
      │ 7. POST /api/admin/clone (template_id, weeks: 4)
      ▼
Clone Logic
      │
      │ 8. FOR i = 1 to 4:
      │    data_efetiva = data_ref + (i * 7 days)
      │    INSERT eventos_instancia (template_id, data_efetiva, semana_numero: i)
      ▼
Supabase DB
      │
      │ 9. INSERT eventos_instancia (4 rows)
      │ 10. RETURNING ids[]
      ▼
API Response
      │
      │ 11. { success: true, instancias: [...] }
      ▼
Admin UI Update
      │
      │ 12. Show toast: "4 events created"
      │ 13. Navigate to event list
      ▼
```

#### Flow 2: Name Parsing & Submission

```
Promoter (Mobile)
      │
      │ 1. Paste raw text (emojis, numbers, 150 names)
      ▼
Public Form (Client)
      │
      │ 2. Client-side preview (non-blocking)
      │ 3. POST /api/submit-names (raw_text, evento_id)
      ▼
API Route (Public)
      │
      │ 4. Rate limit check (Upstash Redis: 10 req/hour/IP)
      │ 5. Validate evento_id exists
      ▼
Parsing Pipeline
      │
      │ 6. Split lines
      │ 7. Remove emojis (regex: /[\p{Emoji}]/gu)
      │ 8. Remove numbering (regex: /^\s*[\d\s\-\.\:,]+/)
      │ 9. Remove special chars (keep accents)
      │ 10. Normalize spaces (trim, collapse)
      │ 11. Title case
      │ 12. Validate (min 2, max 100, pattern check)
      │ 13. Deduplicate (case-insensitive Set)
      ▼
Supabase DB
      │
      │ 14. INSERT guest_submissions {
      │      raw_text, parsed_names[], status: 'Pendente',
      │      expires_at: NOW() + 24h
      │     }
      ▼
API Response
      │
      │ 15. { success: true, valid: 142, rejected: 8, submission_id }
      ▼
Success Screen
      │
      │ 16. Show parsed names
      │ 17. Display submission ID
      │ 18. "Sent for approval" message
      ▼
```

#### Flow 3: Real-time Check-in

```
Doorstaff (Mobile)
      │
      │ 1. Type "João" in search
      │ 2. Debounce 300ms
      ▼
Next.js API
      │
      │ 3. GET /api/portaria/search?q=joão&evento_id=xyz
      ▼
Supabase DB
      │
      │ 4. SELECT * FROM guest_records
      │    WHERE evento_instancia_id = 'xyz'
      │    AND LOWER(nome) LIKE '%joão%'
      │    LIMIT 10
      │
      │ 5. Query time: <50ms (indexed)
      ▼
API Response
      │
      │ 6. [{ id, nome, tipo_cliente, horario_limite }]
      ▼
UI Update
      │
      │ 7. Render results (João Silva, João Pedro)
      │ 8. User taps "João Silva"
      │ 9. POST /api/portaria/checkin
      ▼
Validation Logic
      │
      │ 10. Check current time vs horario_vip_limite
      │ 11. If VIP && now > limit: REJECT
      │ 12. If Convidado || within limit: APPROVE
      ▼
Supabase DB
      │
      │ 13. INSERT check_in_records {
      │      guest_id, evento_id, timestamp,
      │      tipo_cliente (snapshot)
      │     }
      │ 14. Trigger: Supabase Realtime broadcast
      ▼
WebSocket Broadcast
      │
      │ 15. socket.emit('checkin:new', { guest_id, nome, timestamp })
      │ 16. All connected doorstaff receive update
      ▼
UI Feedback
      │
      │ 17. Fullscreen green: "✓ JOÃO SILVA WELCOME!"
      │ 18. Auto-clear in 2s
      │ 19. Other devices: Remove "João Silva" from search results
      ▼
```

---

## DATABASE SCHEMA & DESIGN

### Entity Relationship Diagram

```
┌─────────────────────────────┐
│        boates               │
│  (Venue Master Data)        │
├─────────────────────────────┤
│ PK  id: uuid                │
│     nome: varchar(255)      │
│     timezone: varchar(50)   │
│     capacidade_padrao: int  │
│     ativo: boolean          │
│     created_at: timestamp   │
└────────────┬────────────────┘
             │ 1
             │
             │ N
┌────────────▼────────────────┐     ┌─────────────────────────────┐
│   eventos_template          │ 1   │        users                │
│  (Reusable Event Models)    ├────►│  (Authentication & Roles)   │
├─────────────────────────────┤ N   ├─────────────────────────────┤
│ PK  id: uuid                │     │ PK  id: uuid                │
│ FK  boate_id: uuid          │     │ FK  boate_id: uuid          │
│ FK  admin_id: uuid          │     │     email: varchar(255)     │
│     nome: varchar(255)      │     │     nome: varchar(255)      │
│     data_referencia: date   │     │     role: enum              │
│     hora_inicio: time       │     │     status: enum            │
│     hora_fim: time          │     │     created_at: timestamp   │
│     hora_vip_limite: time   │     └─────────────────────────────┘
│     capacidade: int         │
│     tipo_cliente: enum      │
│     status: enum            │
│     created_at: timestamp   │
└────────────┬────────────────┘
             │ 1
             │
             │ N (clones)
┌────────────▼────────────────────────────────────────────┐
│            eventos_instancia                            │
│  (Concrete Event Instances - Cloned from Template)     │
├─────────────────────────────────────────────────────────┤
│ PK  id: uuid                                            │
│ FK  template_id: uuid (nullable - orphan if deleted)   │
│ FK  boate_id: uuid                                      │
│     nome: varchar(255)                                  │
│     data_efetiva: date (template.data_ref + 7*weeks)   │
│     hora_inicio: time                                   │
│     hora_fim: time                                      │
│     hora_vip_limite: time                               │
│     capacidade: int                                     │
│     tipo_cliente: enum                                  │
│     semana_numero: int (1, 2, 3...)                    │
│     status: enum (Ativo, Cancelado, Finalizado)        │
│     created_at: timestamp                               │
│     updated_at: timestamp                               │
│                                                          │
│ UNIQUE (boate_id, data_efetiva, hora_inicio)           │
│ INDEX (template_id)                                     │
│ INDEX (data_efetiva)                                    │
│ INDEX (status)                                          │
└────────────┬────────────────────────────────────────────┘
             │ 1
             │
             │ N
┌────────────▼────────────────────────────────────────┐
│            guest_submissions                        │
│  (Pending Bulk Name Submissions - Pre-Approval)    │
├─────────────────────────────────────────────────────┤
│ PK  id: uuid                                        │
│ FK  evento_instancia_id: uuid                       │
│     raw_text: text (original paste)                 │
│     parsed_names: jsonb (cleaned array)             │
│     submission_ip: inet                             │
│     status: enum (Rascunho, Pendente, Aprovado,    │
│                   Rejeitado)                        │
│     approval_notes: text                            │
│ FK  approved_by: uuid (users.id)                    │
│     approved_at: timestamp                          │
│     expires_at: timestamp (created_at + 24h)        │
│     created_at: timestamp                           │
│                                                      │
│ INDEX (evento_instancia_id)                         │
│ INDEX (status)                                      │
│ INDEX (expires_at) - for cleanup job                │
└────────────┬────────────────────────────────────────┘
             │ 1
             │
             │ N (after approval)
┌────────────▼────────────────────────────────────────┐
│            guest_records                            │
│  (Approved VIP Names per Event Instance)           │
├─────────────────────────────────────────────────────┤
│ PK  id: uuid                                        │
│ FK  evento_instancia_id: uuid                       │
│ FK  submission_id: uuid (nullable - if from bulk)  │
│     nome: varchar(255)                              │
│     tipo_cliente: enum (VIP, Convidado)            │
│     source: enum (Manual, Import, Submission)      │
│     status: enum (Pendente, Aprovado, Presente)    │
│ FK  added_by: uuid (users.id)                       │
│     created_at: timestamp                           │
│                                                      │
│ UNIQUE (evento_instancia_id, LOWER(nome), submission_id) │
│ -- Homônimos de promoters distintos são permitidos      │
│ INDEX (evento_instancia_id)                               │
│ INDEX (status)                                            │
│ INDEX btree(LOWER(nome)) - fast case-insensitive          │
└────────────┬────────────────────────────────────────┘
             │ 1
             │
             │ 1 (one check-in per guest per event)
┌────────────▼────────────────────────────────────────┐
│            check_in_records                         │
│  (Entry Logs with Temporal Validation Snapshot)    │
├─────────────────────────────────────────────────────┤
│ PK  id: uuid                                        │
│ FK  guest_id: uuid (guest_records.id)               │
│ FK  evento_instancia_id: uuid                       │
│     timestamp_entrada: timestamp DEFAULT NOW()      │
│     horario_evento_inicio: time (snapshot)          │
│     horario_evento_fim: time (snapshot)             │
│     horario_vip_limite: time (snapshot)             │
│     tipo_cliente: enum (snapshot - immutable)      │
│ FK  portaria_user_id: uuid (users.id)               │
│     status: enum (Presente, Saida)                  │
│     created_at: timestamp                           │
│                                                      │
│ UNIQUE (guest_id, evento_instancia_id)             │
│ INDEX (evento_instancia_id)                         │
│ INDEX (timestamp_entrada) - for reports             │
└─────────────────────────────────────────────────────┘
```

### Table Definitions with SQL

#### 1. boates (Venues)

```sql
CREATE TABLE boates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
  capacidade_padrao INT NOT NULL DEFAULT 100 CHECK (capacidade_padrao > 0),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boates_ativo ON boates(ativo);
```

#### 2. users (Authentication & Authorization)

```sql
CREATE TYPE user_role AS ENUM ('Admin', 'Promoter', 'Portaria', 'Viewer');
CREATE TYPE user_status AS ENUM ('Ativo', 'Inativo');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boate_id UUID NOT NULL REFERENCES boates(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'Viewer',
  status user_status NOT NULL DEFAULT 'Ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_boate_role ON users(boate_id, role);
CREATE INDEX idx_users_email ON users(email);
```

#### 3. eventos_template (Event Templates)

```sql
CREATE TYPE evento_tipo_cliente AS ENUM ('VIP', 'Convidado', 'Misto');
CREATE TYPE evento_status AS ENUM ('Ativo', 'Inativo', 'Cancelado');

CREATE TABLE eventos_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boate_id UUID NOT NULL REFERENCES boates(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_referencia DATE NOT NULL CHECK (data_referencia >= CURRENT_DATE),
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL CHECK (hora_fim > hora_inicio),
  hora_vip_limite TIME NOT NULL,
  capacidade INT NOT NULL CHECK (capacidade > 0),
  tipo_cliente evento_tipo_cliente NOT NULL DEFAULT 'VIP',
  status evento_status NOT NULL DEFAULT 'Ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_boate_evento UNIQUE (boate_id, data_referencia, hora_inicio)
);

CREATE INDEX idx_eventos_template_boate_status ON eventos_template(boate_id, status);
CREATE INDEX idx_eventos_template_data ON eventos_template(data_referencia);
```

#### 4. eventos_instancia (Event Instances)

```sql
CREATE TYPE instancia_status AS ENUM ('Ativo', 'Cancelado', 'Finalizado');

CREATE TABLE eventos_instancia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES eventos_template(id) ON DELETE SET NULL,
  boate_id UUID NOT NULL REFERENCES boates(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  data_efetiva DATE NOT NULL, -- Dia de início do evento (antes da meia-noite)
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  -- ATENÇÃO: hora_fim pode ser MENOR que hora_inicio em eventos noturnos (ex: 23:00-05:00)
  -- NÃO usar CHECK (hora_fim > hora_inicio) pois rejeitaria eventos que cruzam meia-noite.
  -- A lógica de validação é feita na aplicação, não via constraint SQL.
  hora_vip_limite TIME NOT NULL,
  capacidade INT NOT NULL CHECK (capacidade > 0),
  tipo_cliente evento_tipo_cliente NOT NULL DEFAULT 'VIP',
  semana_numero INT CHECK (semana_numero > 0),
  status instancia_status NOT NULL DEFAULT 'Ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_boate_instancia UNIQUE (boate_id, data_efetiva, hora_inicio)
);

-- Índice para buscar eventos ativos agora (inclui eventos de ontem que cruzam meia-noite):
-- WHERE data_efetiva = CURRENT_DATE
-- OR (data_efetiva = CURRENT_DATE - 1 AND hora_fim < hora_inicio)
CREATE INDEX idx_eventos_instancia_template ON eventos_instancia(template_id);
CREATE INDEX idx_eventos_instancia_data ON eventos_instancia(data_efetiva);
CREATE INDEX idx_eventos_instancia_status ON eventos_instancia(status);
CREATE INDEX idx_eventos_instancia_boate_data ON eventos_instancia(boate_id, data_efetiva);
```

#### 5. guest_submissions (Pending Approvals)

```sql
CREATE TYPE submission_status AS ENUM ('Rascunho', 'Pendente', 'Aprovado', 'Rejeitado');

CREATE TABLE guest_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_instancia_id UUID NOT NULL REFERENCES eventos_instancia(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  parsed_names JSONB NOT NULL DEFAULT '[]'::jsonb,
  submission_ip INET,
  status submission_status NOT NULL DEFAULT 'Pendente',
  approval_notes TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT check_approval_fields CHECK (
    (status = 'Aprovado' AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR
    (status != 'Aprovado')
  )
);

CREATE INDEX idx_guest_submissions_evento ON guest_submissions(evento_instancia_id);
CREATE INDEX idx_guest_submissions_status ON guest_submissions(status);
CREATE INDEX idx_guest_submissions_expires ON guest_submissions(expires_at) WHERE status = 'Pendente';
```

#### 6. guest_records (Approved Guest Names)

```sql
CREATE TYPE guest_tipo AS ENUM ('VIP', 'Convidado');
CREATE TYPE guest_source AS ENUM ('Manual', 'Import', 'Submission');
CREATE TYPE guest_status AS ENUM ('Pendente', 'Aprovado', 'Rejeitado', 'Presente');

CREATE TABLE guest_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_instancia_id UUID NOT NULL REFERENCES eventos_instancia(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES guest_submissions(id) ON DELETE SET NULL,
  nome VARCHAR(255) NOT NULL,
  tipo_cliente guest_tipo NOT NULL DEFAULT 'VIP',
  source guest_source NOT NULL DEFAULT 'Manual',
  status guest_status NOT NULL DEFAULT 'Aprovado',
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Permite o mesmo nome de promoters distintos (homônimos reais);
  -- previne duplicata dentro da mesma submissão.
  -- submission_id = NULL para entradas manuais (admin) — tratadas individualmente pela aplicação.
  CONSTRAINT unique_guest_per_submission UNIQUE (evento_instancia_id, LOWER(nome), submission_id)
);

CREATE INDEX idx_guest_records_evento ON guest_records(evento_instancia_id);
CREATE INDEX idx_guest_records_status ON guest_records(status);
CREATE INDEX idx_guest_records_nome_lower ON guest_records(LOWER(nome));
CREATE INDEX idx_guest_records_search ON guest_records
  USING gin(to_tsvector('portuguese', nome));
```

#### 7. check_in_records (Entry Logs)

```sql
CREATE TYPE checkin_status AS ENUM ('Presente', 'Saida');

CREATE TABLE check_in_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guest_records(id) ON DELETE CASCADE,
  evento_instancia_id UUID NOT NULL REFERENCES eventos_instancia(id) ON DELETE CASCADE,
  timestamp_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  horario_evento_inicio TIME NOT NULL,
  horario_evento_fim TIME NOT NULL,
  horario_vip_limite TIME NOT NULL,
  tipo_cliente guest_tipo NOT NULL,
  portaria_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status checkin_status NOT NULL DEFAULT 'Presente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_checkin_per_guest UNIQUE (guest_id, evento_instancia_id)
);

CREATE INDEX idx_check_in_records_evento ON check_in_records(evento_instancia_id);
CREATE INDEX idx_check_in_records_timestamp ON check_in_records(timestamp_entrada);
CREATE INDEX idx_check_in_records_guest ON check_in_records(guest_id);
```

### Database Indexes Strategy

```sql
-- Performance optimization for common queries

-- 1. Fast event lookups by date range
CREATE INDEX idx_eventos_instancia_date_range
  ON eventos_instancia(data_efetiva)
  WHERE status = 'Ativo';

-- 2. Fast guest search (case-insensitive)
CREATE INDEX idx_guest_records_nome_trgm
  ON guest_records
  USING gin(nome gin_trgm_ops);

-- 3. Check-in reports by time
CREATE INDEX idx_check_in_records_time_slot
  ON check_in_records(evento_instancia_id, timestamp_entrada);

-- 4. Pending approvals dashboard
CREATE INDEX idx_submissions_pending
  ON guest_submissions(created_at DESC)
  WHERE status = 'Pendente';

-- 5. Active events for doorstaff
CREATE INDEX idx_active_eventos_today
  ON eventos_instancia(data_efetiva)
  WHERE status = 'Ativo' AND data_efetiva = CURRENT_DATE;
```

### Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE boates ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_instancia ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_records ENABLE ROW LEVEL SECURITY;

-- Example: Users can only see data from their venue
CREATE POLICY "Users can view own venue data" ON eventos_instancia
  FOR SELECT
  USING (boate_id = (SELECT boate_id FROM users WHERE id = auth.uid()));

-- Example: Admins have full access
CREATE POLICY "Admins have full access" ON guest_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'Admin'
      AND boate_id = guest_records.evento_instancia_id
    )
  );

-- Example: Doorstaff can only check-in
CREATE POLICY "Doorstaff can check-in" ON check_in_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'Portaria'
    )
  );
```

---

## API ARCHITECTURE

### API Design Principles

1. **RESTful** - Resource-based URLs, standard HTTP methods
2. **Idempotent** - Safe retries on network failures
3. **Versioned** - `/api/v1/...` for future-proofing
4. **Typed** - TypeScript end-to-end with Zod validation
5. **Documented** - OpenAPI 3.0 spec auto-generated

### Route Structure

```
/api/
├── v1/
│   ├── admin/
│   │   ├── events
│   │   │   ├── GET     /api/v1/admin/events (list with filters)
│   │   │   ├── POST    /api/v1/admin/events (create template)
│   │   │   ├── GET     /api/v1/admin/events/:id (get details)
│   │   │   ├── PUT     /api/v1/admin/events/:id (update)
│   │   │   ├── DELETE  /api/v1/admin/events/:id (soft delete)
│   │   │   └── POST    /api/v1/admin/events/:id/clone (clone with recurrence)
│   │   ├── submissions
│   │   │   ├── GET     /api/v1/admin/submissions (list pending)
│   │   │   ├── GET     /api/v1/admin/submissions/:id (get details)
│   │   │   ├── POST    /api/v1/admin/submissions/:id/approve (bulk approve)
│   │   │   └── POST    /api/v1/admin/submissions/:id/reject (reject with reason)
│   │   └── analytics
│   │       ├── GET     /api/v1/admin/analytics/overview (dashboard stats)
│   │       └── GET     /api/v1/admin/analytics/events/:id/report (event report)
│   ├── portaria/
│   │   ├── search
│   │   │   └── GET     /api/v1/portaria/search (real-time guest search)
│   │   ├── checkin
│   │   │   ├── POST    /api/v1/portaria/checkin (perform check-in)
│   │   │   └── GET     /api/v1/portaria/checkin/history (today's check-ins)
│   │   └── events
│   │       └── GET     /api/v1/portaria/events/active (today's active events)
│   └── public/
│       ├── submit
│       │   └── POST    /api/v1/public/submit (name submission - NO AUTH)
│       └── events
│           └── GET     /api/v1/public/events/:id/info (event details - NO AUTH)
└── health
    └── GET /api/health (health check)
```

### Request/Response Standards

#### Standard Success Response

```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

#### Standard Error Response

```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable message (Portuguese)
    details?: Record<string, any>; // Additional context
    field?: string; // For validation errors
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

#### Error Codes

```typescript
enum ApiErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_DATE = 'INVALID_DATE',
  INVALID_TIME = 'INVALID_TIME',

  // Business Logic
  TIME_RESTRICTION = 'TIME_RESTRICTION',
  DUPLICATE_CHECKIN = 'DUPLICATE_CHECKIN',
  DUPLICATE_GUEST = 'DUPLICATE_GUEST',
  CAPACITY_EXCEEDED = 'CAPACITY_EXCEEDED',
  PARSING_ERROR = 'PARSING_ERROR',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}
```

### Middleware Stack

```typescript
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Request ID for tracing
  const requestId = crypto.randomUUID();
  response.headers.set('X-Request-ID', requestId);

  // 2. CORS (restrictive)
  const origin = request.headers.get('origin');
  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // 3. Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );

  // 4. Rate limiting (public endpoints only)
  if (request.nextUrl.pathname.startsWith('/api/v1/public')) {
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Limite de requisições excedido',
            details: {
              retryAfter: rateLimitResult.retryAfter
            }
          }
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter)
          }
        }
      );
    }
  }

  return response;
}

export const config = {
  matcher: '/api/:path*'
};
```

### Validation with Zod

```typescript
// lib/validation/schemas.ts

import { z } from 'zod';

// Event creation schema
export const createEventSchema = z.object({
  nome: z.string().min(3).max(255),
  descricao: z.string().max(1000).optional(),
  data_referencia: z.string().refine(
    (date) => new Date(date) >= new Date(),
    { message: 'Data deve ser >= hoje' }
  ),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  hora_fim: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  hora_vip_limite: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  capacidade: z.number().int().min(1).max(10000),
  tipo_cliente: z.enum(['VIP', 'Convidado', 'Misto']),
  boate_id: z.string().uuid()
}).refine(
  (data) => data.hora_fim > data.hora_inicio,
  { message: 'Hora fim deve ser > hora início', path: ['hora_fim'] }
);

// Clone event schema
export const cloneEventSchema = z.object({
  semanas: z.number().int().min(1).max(52),
  manter_horarios: z.boolean().default(true),
  manter_capacidade: z.boolean().default(true)
});

// Name submission schema
export const submitNamesSchema = z.object({
  evento_id: z.string().uuid(),
  raw_text: z.string().min(1).max(50000) // ~50KB limit
});

// Check-in schema
export const checkinSchema = z.object({
  guest_id: z.string().uuid(),
  evento_id: z.string().uuid(),
  timestamp: z.number().int().positive()
});

// Search schema
export const searchSchema = z.object({
  q: z.string().min(1).max(100),
  evento_id: z.string().uuid(),
  limit: z.number().int().min(1).max(50).default(10)
});

// Usage in API route
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createEventSchema.parse(body);

    // Proceed with validated data
    const result = await createEvent(validated);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: error.errors
        }
      }, { status: 400 });
    }

    // Handle other errors...
  }
}
```

---

## FRONTEND ARCHITECTURE

### Component Architecture

```
src/
├── app/ (Next.js 14 App Router)
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx (Auth layout)
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   ├── events/
│   │   │   │   ├── page.tsx (Event list)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx (Create event form)
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx (Event details)
│   │   │   │       ├── edit/
│   │   │   │       │   └── page.tsx (Edit form)
│   │   │   │       └── clone/
│   │   │   │           └── page.tsx (Clone modal)
│   │   │   ├── submissions/
│   │   │   │   ├── page.tsx (Pending list)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx (Review modal)
│   │   │   └── analytics/
│   │   │       └── page.tsx (Dashboard)
│   │   ├── portaria/
│   │   │   ├── page.tsx (Event selector)
│   │   │   └── [eventId]/
│   │   │       ├── checkin/
│   │   │       │   └── page.tsx (Check-in interface)
│   │   │       └── report/
│   │   │           └── page.tsx (Today's report)
│   │   └── layout.tsx (Dashboard layout with navbar)
│   ├── submit/
│   │   └── [eventId]/
│   │       └── page.tsx (Public submission form)
│   ├── api/ (API Routes)
│   │   └── v1/
│   │       ├── admin/
│   │       ├── portaria/
│   │       └── public/
│   ├── layout.tsx (Root layout)
│   └── page.tsx (Landing/redirect)
├── components/
│   ├── ui/ (Shadcn/ui components - 47 components)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── admin/
│   │   ├── EventCard.tsx
│   │   ├── EventForm.tsx
│   │   ├── CloneModal.tsx
│   │   ├── SubmissionReviewModal.tsx
│   │   └── AnalyticsDashboard.tsx
│   ├── portaria/
│   │   ├── SearchBar.tsx
│   │   ├── GuestResult.tsx
│   │   ├── CheckinFeedback.tsx (Fullscreen green/red)
│   │   └── ReportTable.tsx
│   ├── public/
│   │   ├── SubmissionForm.tsx
│   │   ├── NameParsingPreview.tsx
│   │   └── SuccessScreen.tsx
│   └── shared/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       ├── ThemeToggle.tsx
│       └── LoadingSpinner.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts (API client wrapper)
│   │   ├── admin.ts (Admin API calls)
│   │   ├── portaria.ts (Doorstaff API calls)
│   │   └── public.ts (Public API calls)
│   ├── auth/
│   │   ├── supabase.ts (Supabase client)
│   │   ├── session.ts (Session management)
│   │   └── permissions.ts (Role checks)
│   ├── parsing/
│   │   ├── parser.ts (Name parsing logic)
│   │   ├── validation.ts (Name validation)
│   │   └── utils.ts (Helpers)
│   ├── realtime/
│   │   ├── socket.ts (WebSocket client)
│   │   └── hooks.ts (useRealtimeCheckins, etc.)
│   ├── utils.ts (General utilities)
│   └── constants.ts (App constants)
├── hooks/
│   ├── useAuth.ts
│   ├── useEvents.ts
│   ├── useGuests.ts
│   ├── useCheckin.ts
│   ├── useSubmissions.ts
│   ├── useDebounce.ts
│   ├── usePagination.ts
│   └── useTheme.ts
├── types/
│   ├── database.ts (Supabase generated types)
│   ├── api.ts (API request/response types)
│   └── models.ts (Domain models)
└── styles/
    └── globals.css (Tailwind + custom styles)
```

### State Management Strategy

```typescript
// Using React Query for server state + Zustand for UI state

// lib/store/ui.ts (Zustand - UI State)
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  theme: 'light',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme })
}));

// hooks/useEvents.ts (React Query - Server State)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvents, createEvent, cloneEvent } from '@/lib/api/admin';

export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => getEvents(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30 // 30 minutes (formerly cacheTime)
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });
}

export function useCloneEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, weeks }: { id: string; weeks: number }) =>
      cloneEvent(id, weeks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });
}

// Usage in component
function EventListPage() {
  const { data: events, isLoading } = useEvents({ status: 'Ativo' });
  const createMutation = useCreateEvent();
  const cloneMutation = useCloneEvent();

  const handleCreate = async (data: EventFormData) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Evento criado com sucesso');
    } catch (error) {
      toast.error('Erro ao criar evento');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {events?.map(event => (
        <EventCard key={event.id} event={event} onClone={cloneMutation.mutate} />
      ))}
    </div>
  );
}
```

### Real-time Hooks

```typescript
// hooks/useRealtimeCheckins.ts

import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/realtime/socket';

interface CheckinEvent {
  guest_id: string;
  guest_nome: string;
  evento_id: string;
  timestamp: string;
  tipo_cliente: 'VIP' | 'Convidado';
}

export function useRealtimeCheckins(eventoId: string) {
  const socket = useSocket();
  const [checkins, setCheckins] = useState<CheckinEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Join room for this event
    socket.emit('join_event', eventoId);

    // Connection status
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Listen for new check-ins
    socket.on('checkin:new', (data: CheckinEvent) => {
      if (data.evento_id === eventoId) {
        setCheckins((prev) => [data, ...prev]);
      }
    });

    // Cleanup
    return () => {
      socket.emit('leave_event', eventoId);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('checkin:new');
    };
  }, [socket, eventoId]);

  return { checkins, isConnected };
}
```

### Critical UI Components

#### 1. Check-in Feedback (Fullscreen)

```typescript
// components/portaria/CheckinFeedback.tsx

interface CheckinFeedbackProps {
  result: 'success' | 'blocked' | 'already';
  guestName: string;
  message: string;
  onClose: () => void;
}

export function CheckinFeedback({ result, guestName, message, onClose }: CheckinFeedbackProps) {
  const bgColor = {
    success: 'bg-success-bg',
    blocked: 'bg-error-bg',
    already: 'bg-warning-bg'
  }[result];

  const icon = {
    success: '✓✓✓✓✓',
    blocked: '✗✗✗✗✗',
    already: '⚠⚠⚠⚠⚠'
  }[result];

  // Auto-close after 2 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={cn(
      'fixed inset-0 flex flex-col items-center justify-center',
      'text-white z-50 p-8 text-center',
      bgColor
    )}>
      <div className="text-6xl mb-4 animate-bounce">{icon}</div>
      <h1 className="text-4xl font-bold mb-2 uppercase">
        {guestName}
      </h1>
      <p className="text-2xl mb-8">{message}</p>

      <button
        onClick={onClose}
        className="text-lg underline opacity-75 hover:opacity-100"
      >
        Fechar
      </button>
    </div>
  );
}
```

#### 2. Search Bar (Doorstaff)

```typescript
// components/portaria/SearchBar.tsx

interface SearchBarProps {
  eventoId: string;
  onSelectGuest: (guest: GuestResult) => void;
}

export function SearchBar({ eventoId, onSelectGuest }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', eventoId, debouncedQuery],
    queryFn: () => searchGuests(eventoId, debouncedQuery),
    enabled: debouncedQuery.length > 0
  });

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Buscar VIP..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-16 text-lg px-6"
        autoFocus
      />

      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {results && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-card border rounded-lg shadow-lg mt-2 max-h-[400px] overflow-auto z-10">
          {results.map((guest) => (
            <button
              key={guest.id}
              onClick={() => onSelectGuest(guest)}
              className="w-full text-left p-4 hover:bg-accent border-b last:border-b-0"
            >
              <div className="font-semibold text-lg">{guest.nome}</div>
              <div className="text-sm text-muted-foreground">
                {guest.tipo_cliente}
                {guest.horario_limite && ` • Até ${guest.horario_limite}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {results && results.length === 0 && debouncedQuery && (
        <div className="absolute top-full left-0 right-0 bg-card border rounded-lg shadow-lg mt-2 p-8 text-center z-10">
          <p className="text-muted-foreground">Nenhum resultado encontrado</p>
        </div>
      )}
    </div>
  );
}
```

---

## REAL-TIME ARCHITECTURE

### WebSocket Implementation

```typescript
// lib/realtime/socket.ts (Client)

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initSocket(token: string): Socket {
  if (socket) return socket;

  socket = io(process.env.NEXT_PUBLIC_WS_URL || '', {
    auth: { token },
    transports: ['websocket', 'polling'], // Fallback to polling
    reconnectionDelay: 1000,
    reconnection: true,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', (reason) => {
    console.warn('WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
    // Fallback to polling automatically
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function useSocket() {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    const { data: session } = useAuth();
    if (!session) return;

    const socket = initSocket(session.access_token);
    setSocketInstance(socket);

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketInstance;
}
```

```typescript
// app/api/socket/route.ts (Server)

import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL,
    credentials: true
  }
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const user = await verifyToken(token);
    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join event room
  socket.on('join_event', (eventoId: string) => {
    socket.join(`event:${eventoId}`);
    console.log(`Socket ${socket.id} joined event:${eventoId}`);
  });

  // Leave event room
  socket.on('leave_event', (eventoId: string) => {
    socket.leave(`event:${eventoId}`);
    console.log(`Socket ${socket.id} left event:${eventoId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Broadcast check-in to all clients in event room
export function broadcastCheckin(eventoId: string, data: CheckinEvent) {
  io.to(`event:${eventoId}`).emit('checkin:new', data);
}

httpServer.listen(3001);
```

### Offline Fallback Strategy

```typescript
// lib/realtime/offline.ts

interface QueuedCheckin {
  id: string;
  guest_id: string;
  evento_id: string;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
}

class OfflineQueue {
  private queue: QueuedCheckin[] = [];
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('checkin_queue', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('checkins')) {
          db.createObjectStore('checkins', { keyPath: 'id' });
        }
      };
    });
  }

  async add(checkin: Omit<QueuedCheckin, 'id' | 'status'>) {
    if (!this.db) await this.init();

    const id = crypto.randomUUID();
    const item: QueuedCheckin = {
      ...checkin,
      id,
      status: 'pending'
    };

    const tx = this.db!.transaction('checkins', 'readwrite');
    const store = tx.objectStore('checkins');
    await store.add(item);

    return item;
  }

  async syncAll() {
    if (!this.db) return;

    const tx = this.db.transaction('checkins', 'readonly');
    const store = tx.objectStore('checkins');
    const allCheckins = await store.getAll();

    const pending = allCheckins.filter(c => c.status === 'pending');

    for (const checkin of pending) {
      try {
        await checkinApi(checkin);
        await this.markSynced(checkin.id);
      } catch (error) {
        console.error('Failed to sync check-in:', checkin.id, error);
      }
    }
  }

  async markSynced(id: string) {
    if (!this.db) return;

    const tx = this.db.transaction('checkins', 'readwrite');
    const store = tx.objectStore('checkins');
    const checkin = await store.get(id);

    if (checkin) {
      checkin.status = 'synced';
      await store.put(checkin);
    }
  }

  async getPendingCount() {
    if (!this.db) return 0;

    const tx = this.db.transaction('checkins', 'readonly');
    const store = tx.objectStore('checkins');
    const allCheckins = await store.getAll();

    return allCheckins.filter(c => c.status === 'pending').length;
  }
}

export const offlineQueue = new OfflineQueue();

// Usage in check-in component
async function performCheckin(guestId: string, eventoId: string) {
  try {
    if (!navigator.onLine) {
      // Offline: queue for later
      await offlineQueue.add({
        guest_id: guestId,
        evento_id: eventoId,
        timestamp: Date.now()
      });

      toast.warning('Offline: Check-in será sincronizado quando voltar online');
      return;
    }

    // Online: perform immediately
    await checkinApi({ guest_id: guestId, evento_id: eventoId });
    toast.success('Check-in realizado!');
  } catch (error) {
    // Network error: queue for retry
    await offlineQueue.add({
      guest_id: guestId,
      evento_id: eventoId,
      timestamp: Date.now()
    });

    toast.error('Erro de rede. Check-in foi salvo e será reenviad');
  }
}

// Auto-sync when online
window.addEventListener('online', async () => {
  const pendingCount = await offlineQueue.getPendingCount();
  if (pendingCount > 0) {
    toast.info(`Sincronizando ${pendingCount} check-ins pendentes...`);
    await offlineQueue.syncAll();
    toast.success('Sincronização concluída!');
  }
});
```

---

## SECURITY ARCHITECTURE

### Authentication Flow

```
1. User Login
   ├─> POST /api/auth/login { email, password }
   ├─> Supabase Auth validates credentials
   ├─> Returns JWT (access_token + refresh_token)
   └─> Store in httpOnly cookie + localStorage

2. Authenticated Request
   ├─> Client sends request with Authorization: Bearer <token>
   ├─> Middleware verifies JWT signature
   ├─> Middleware checks role permissions
   ├─> If valid: proceed to route handler
   └─> If invalid: return 401 Unauthorized

3. Token Refresh
   ├─> Access token expires (1 hour)
   ├─> Client auto-refreshes with refresh_token
   ├─> Supabase returns new access_token
   └─> Update stored tokens

4. Logout
   ├─> POST /api/auth/logout
   ├─> Supabase invalidates session
   ├─> Clear cookies + localStorage
   └─> Redirect to /login
```

### Role-Based Access Control (RBAC)

```typescript
// lib/auth/permissions.ts

export enum Permission {
  // Events
  EVENT_CREATE = 'event:create',
  EVENT_READ = 'event:read',
  EVENT_UPDATE = 'event:update',
  EVENT_DELETE = 'event:delete',
  EVENT_CLONE = 'event:clone',

  // Guests
  GUEST_CREATE = 'guest:create',
  GUEST_READ = 'guest:read',
  GUEST_UPDATE = 'guest:update',
  GUEST_DELETE = 'guest:delete',

  // Submissions
  SUBMISSION_CREATE = 'submission:create', // Public (no auth)
  SUBMISSION_READ = 'submission:read',
  SUBMISSION_APPROVE = 'submission:approve',
  SUBMISSION_REJECT = 'submission:reject',

  // Check-ins
  CHECKIN_PERFORM = 'checkin:perform',
  CHECKIN_READ = 'checkin:read',
  CHECKIN_REPORT = 'checkin:report'
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Admin: Object.values(Permission), // All permissions

  Portaria: [
    Permission.EVENT_READ,
    Permission.GUEST_READ,
    Permission.CHECKIN_PERFORM,
    Permission.CHECKIN_READ,
    Permission.CHECKIN_REPORT
  ],

  Promoter: [
    Permission.EVENT_READ,
    Permission.SUBMISSION_CREATE
  ],

  Viewer: [
    Permission.EVENT_READ,
    Permission.GUEST_READ,
    Permission.CHECKIN_READ,
    Permission.CHECKIN_REPORT
  ]
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function requirePermission(permission: Permission) {
  return async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!hasPermission(user.role, permission)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Permission granted, continue
    return null;
  };
}

// Usage in API route
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionError = await requirePermission(Permission.EVENT_DELETE)(request);
  if (permissionError) return permissionError;

  // Proceed with deletion
  await deleteEvent(params.id);

  return NextResponse.json({ success: true });
}
```

### Input Sanitization

```typescript
// lib/security/sanitize.ts

import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeString(input: string): string {
  // Trim whitespace
  let clean = input.trim();

  // Remove null bytes
  clean = clean.replace(/\0/g, '');

  // Escape HTML
  clean = validator.escape(clean);

  return clean;
}

export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: []
  });
}

export function sanitizeSQL(input: string): string {
  // Use parameterized queries (Prisma/Supabase handles this)
  // This is a backup check
  const dangerous = ['--', ';', '/*', '*/', 'xp_', 'sp_', 'DROP', 'DELETE', 'INSERT'];

  for (const pattern of dangerous) {
    if (input.toUpperCase().includes(pattern)) {
      throw new Error('Potential SQL injection detected');
    }
  }

  return input;
}

// Usage in parsing pipeline
function parseNames(rawText: string): ParseResult {
  // 1. Sanitize input first
  const sanitized = sanitizeHTML(rawText);

  // 2. Then apply parsing logic
  const lines = sanitized.split('\n');

  // ... rest of parsing
}
```

### Rate Limiting with Upstash Redis

```typescript
// lib/security/rateLimit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

// Different limits for different endpoints
export const rateLimiters = {
  // Public submission: 10 requests per hour per IP
  submission: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: '@submission'
  }),

  // Check-in: 100 requests per minute per user
  checkin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: '@checkin'
  }),

  // Search: 300 requests per minute per user (very high, low-cost query)
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '1 m'),
    analytics: true,
    prefix: '@search'
  })
};

export async function checkRateLimit(
  identifier: string,
  limiter: keyof typeof rateLimiters
) {
  const { success, limit, reset, remaining } = await rateLimiters[limiter].limit(
    identifier
  );

  return {
    allowed: success,
    limit,
    remaining,
    reset: new Date(reset)
  };
}

// Usage in API route
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const result = await checkRateLimit(ip, 'submission');

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Limite de requisições excedido',
          details: {
            retryAfter: result.reset
          }
        }
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': result.reset.toISOString()
        }
      }
    );
  }

  // Proceed with request
}
```

---

## PERFORMANCE & SCALABILITY

### Performance Targets (P95)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Response Time** | | |
| - Event List | < 200ms | Server-side timing |
| - Guest Search | < 100ms | Server-side timing |
| - Check-in | < 500ms | Server-side timing |
| - Name Parsing | < 50ms (500 names) | Server-side timing |
| **Frontend** | | |
| - Time to Interactive (TTI) | < 3s (mobile 4G) | Lighthouse |
| - First Contentful Paint (FCP) | < 1.8s | Lighthouse |
| - Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| - Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| **Real-time** | | |
| - WebSocket Latency | < 1s | Custom metric |
| - Offline Sync Time | < 5s (100 items) | Custom metric |

### Database Optimization

```sql
-- 1. Composite indexes for common queries
CREATE INDEX idx_eventos_instancia_active_today
  ON eventos_instancia(boate_id, data_efetiva, status)
  WHERE status = 'Ativo' AND data_efetiva = CURRENT_DATE;

-- 2. Partial index for pending submissions
CREATE INDEX idx_submissions_pending_recent
  ON guest_submissions(created_at DESC)
  WHERE status = 'Pendente' AND expires_at > NOW();

-- 3. GIN index for full-text search
CREATE INDEX idx_guest_records_fulltext
  ON guest_records
  USING gin(to_tsvector('portuguese', nome));

-- 4. Materialized view for analytics (refresh hourly)
CREATE MATERIALIZED VIEW mv_event_stats AS
SELECT
  e.id as evento_id,
  e.nome,
  e.data_efetiva,
  e.capacidade,
  COUNT(DISTINCT g.id) as total_guests,
  COUNT(DISTINCT c.id) as total_checkins,
  ROUND(COUNT(DISTINCT c.id)::numeric / e.capacidade * 100, 2) as taxa_ocupacao,
  MIN(c.timestamp_entrada) as primeiro_checkin,
  MAX(c.timestamp_entrada) as ultimo_checkin
FROM eventos_instancia e
LEFT JOIN guest_records g ON g.evento_instancia_id = e.id
LEFT JOIN check_in_records c ON c.evento_instancia_id = e.id
WHERE e.data_efetiva >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY e.id, e.nome, e.data_efetiva, e.capacidade;

CREATE UNIQUE INDEX ON mv_event_stats(evento_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_event_stats; -- Run hourly
```

### Caching Strategy

```typescript
// lib/cache/strategy.ts

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

interface CacheStrategy {
  key: string;
  ttl: number; // seconds
  staleWhileRevalidate?: number; // seconds
}

const CACHE_STRATEGIES: Record<string, CacheStrategy> = {
  // Event list: Cache 5 minutes, serve stale up to 1 hour while revalidating
  events: {
    key: 'events:list',
    ttl: 300,
    staleWhileRevalidate: 3600
  },

  // Guest list: Cache 1 minute (frequently updated)
  guests: {
    key: (eventoId: string) => `guests:${eventoId}`,
    ttl: 60,
    staleWhileRevalidate: 300
  },

  // Check-in stats: Cache 30 seconds
  stats: {
    key: (eventoId: string) => `stats:${eventoId}`,
    ttl: 30
  },

  // Parsed names (deduplication check): Cache 1 hour
  parsed: {
    key: (hash: string) => `parsed:${hash}`,
    ttl: 3600
  }
};

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) {
    return cached as T;
  }

  // Cache miss: fetch and store
  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
}

// Usage in API route
export async function GET(request: NextRequest) {
  const boateId = request.headers.get('X-Boate-ID');

  const events = await getCached(
    `events:${boateId}`,
    () => getEventsFromDB(boateId),
    CACHE_STRATEGIES.events.ttl
  );

  return NextResponse.json({ success: true, data: events });
}
```

### Scalability Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PRODUCTION SCALING                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Phase 1: MVP (1-10 venues)                                 │
│  ├─ Vercel Hobby ($0/mo)                                    │
│  ├─ Supabase Free Tier ($0/mo)                              │
│  ├─ Upstash Free Tier ($0/mo)                               │
│  └─ Total: $0/mo                                            │
│                                                              │
│  Phase 2: Growth (10-100 venues)                            │
│  ├─ Vercel Pro ($20/mo)                                     │
│  ├─ Supabase Pro ($25/mo)                                   │
│  ├─ Upstash Pro ($10/mo)                                    │
│  ├─ Sentry Teams ($29/mo)                                   │
│  └─ Total: $84/mo                                           │
│                                                              │
│  Phase 3: Scale (100-500 venues)                            │
│  ├─ Vercel Enterprise (custom)                              │
│  ├─ Supabase Team ($599/mo)                                 │
│  ├─ Upstash Pro ($50/mo)                                    │
│  ├─ Sentry Business ($89/mo)                                │
│  ├─ Load Balancer                                           │
│  └─ Total: ~$800-1500/mo                                    │
│                                                              │
│  Phase 4: Enterprise (500+ venues)                          │
│  ├─ Self-hosted Kubernetes (AWS/GCP)                        │
│  ├─ Multi-region PostgreSQL (RDS/CloudSQL)                  │
│  ├─ Redis Cluster                                           │
│  ├─ CDN (CloudFlare Enterprise)                             │
│  └─ Total: ~$5000-10000/mo                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## DEVOPS & INFRASTRUCTURE

### CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yml

name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.x'
  PNPM_VERSION: '9.x'

jobs:
  # Job 1: Lint & Type Check
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

  # Job 2: Unit Tests
  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # Job 3: E2E Tests
  e2e:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL_TEST }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_TEST }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  # Job 4: Build
  build:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Analyze bundle size
        run: pnpm analyze

  # Job 5: Deploy to Staging (on develop branch)
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    needs: build
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}

  # Job 6: Deploy to Production (on main branch)
  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: build
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}

      - name: Create Sentry release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
        with:
          environment: production
```

### Environment Variables

```bash
# .env.example

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# WebSocket
NEXT_PUBLIC_WS_URL=wss://your-app.vercel.app

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.com
NODE_ENV=production

# Feature Flags (optional)
NEXT_PUBLIC_FEATURE_OFFLINE_MODE=true
NEXT_PUBLIC_FEATURE_WEBSOCKET=true
```

### Monitoring & Observability

```typescript
// lib/monitoring/sentry.ts

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // Sample 10% of transactions

  // Performance monitoring
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/yourapp\.vercel\.app/
      ]
    })
  ],

  // Filter sensitive data
  beforeSend(event) {
    // Remove passwords, tokens, etc.
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers['authorization'];
      }
    }
    return event;
  }
});

// Custom tracking
export function trackPerformance(name: string, value: number) {
  Sentry.setMeasurement(name, value, 'millisecond');
}

export function trackError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}
```

---

## FOLDER STRUCTURE

### Complete Project Structure

```
gerenciador-de-listas/
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── .husky/
│   ├── pre-commit
│   └── pre-push
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── placeholder.svg
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   │   ├── events/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       ├── edit/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       └── clone/
│   │   │   │   │           └── page.tsx
│   │   │   │   ├── submissions/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── analytics/
│   │   │   │       └── page.tsx
│   │   │   ├── portaria/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [eventId]/
│   │   │   │       ├── checkin/
│   │   │   │       │   └── page.tsx
│   │   │   │       └── report/
│   │   │   │           └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── submit/
│   │   │   └── [eventId]/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── health/
│   │   │   │   └── route.ts
│   │   │   └── v1/
│   │   │       ├── admin/
│   │   │       │   ├── events/
│   │   │       │   │   ├── route.ts
│   │   │       │   │   └── [id]/
│   │   │       │   │       ├── route.ts
│   │   │       │   │       └── clone/
│   │   │       │   │           └── route.ts
│   │   │       │   └── submissions/
│   │   │       │       ├── route.ts
│   │   │       │       └── [id]/
│   │   │       │           ├── approve/
│   │   │       │           │   └── route.ts
│   │   │       │           └── reject/
│   │   │       │               └── route.ts
│   │   │       ├── portaria/
│   │   │       │   ├── search/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── checkin/
│   │   │       │   │   └── route.ts
│   │   │       │   └── events/
│   │   │       │       └── active/
│   │   │       │           └── route.ts
│   │   │       └── public/
│   │   │           ├── submit/
│   │   │           │   └── route.ts
│   │   │           └── events/
│   │   │               └── [id]/
│   │   │                   └── info/
│   │   │                       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/ (Shadcn/ui - 47 components)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── form.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── table.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ... (30+ more)
│   │   ├── admin/
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventForm.tsx
│   │   │   ├── CloneModal.tsx
│   │   │   ├── SubmissionReviewModal.tsx
│   │   │   └── AnalyticsDashboard.tsx
│   │   ├── portaria/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── GuestResult.tsx
│   │   │   ├── CheckinFeedback.tsx
│   │   │   └── ReportTable.tsx
│   │   ├── public/
│   │   │   ├── SubmissionForm.tsx
│   │   │   ├── NameParsingPreview.tsx
│   │   │   └── SuccessScreen.tsx
│   │   └── shared/
│   │       ├── Navbar.tsx
│   │       ├── Sidebar.tsx
│   │       ├── ThemeToggle.tsx
│   │       ├── ThemeProvider.tsx
│   │       └── LoadingSpinner.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── admin.ts
│   │   │   ├── portaria.ts
│   │   │   └── public.ts
│   │   ├── auth/
│   │   │   ├── supabase.ts
│   │   │   ├── session.ts
│   │   │   └── permissions.ts
│   │   ├── parsing/
│   │   │   ├── parser.ts
│   │   │   ├── validation.ts
│   │   │   └── utils.ts
│   │   ├── realtime/
│   │   │   ├── socket.ts
│   │   │   ├── offline.ts
│   │   │   └── hooks.ts
│   │   ├── cache/
│   │   │   └── strategy.ts
│   │   ├── security/
│   │   │   ├── rateLimit.ts
│   │   │   └── sanitize.ts
│   │   ├── monitoring/
│   │   │   └── sentry.ts
│   │   ├── validation/
│   │   │   └── schemas.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useEvents.ts
│   │   ├── useGuests.ts
│   │   ├── useCheckin.ts
│   │   ├── useSubmissions.ts
│   │   ├── useDebounce.ts
│   │   ├── usePagination.ts
│   │   ├── useTheme.ts
│   │   └── useRealtimeCheckins.ts
│   ├── store/
│   │   └── ui.ts
│   └── types/
│       ├── database.ts
│       ├── api.ts
│       └── models.ts
├── tests/
│   ├── unit/
│   │   ├── parsing.test.ts
│   │   ├── validation.test.ts
│   │   └── utils.test.ts
│   ├── integration/
│   │   ├── events.test.ts
│   │   ├── checkin.test.ts
│   │   └── submissions.test.ts
│   └── e2e/
│       ├── admin-flow.spec.ts
│       ├── portaria-flow.spec.ts
│       └── public-flow.spec.ts
├── docs/
│   ├── DOCS_ARCHITECTURE.md (this file)
│   ├── DOCS_BUSINESS_LOGIC.md
│   ├── DOCS_DESIGN_SYSTEM.md
│   ├── DOCS_PROJECT_PLAN.md
│   ├── DOCS_UX_FLOW.md
│   ├── API_REFERENCE.md
│   ├── IMPLEMENTATION_CHECKLIST.md
│   ├── PARSING_ALGORITHM_SPEC.md
│   ├── QUICK_START_DEV.md
│   └── README_SPECIFICATION.md
├── scripts/
│   ├── db/
│   │   ├── 00-setup-database.sql
│   │   ├── 01-create-tables.sql
│   │   ├── 02-create-indexes.sql
│   │   ├── 03-create-rls-policies.sql
│   │   └── 04-seed-data.sql
│   └── deploy/
│       └── vercel-deploy.sh
├── .env.example
├── .env.local (gitignored)
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── components.json
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## IMPLEMENTATION ROADMAP

### Sprint 0: Setup (2 days)

```bash
# Day 1: Project Initialization
pnpm create next-app@latest gerenciador-de-listas --typescript --tailwind --app
cd gerenciador-de-listas

# Install core dependencies
pnpm add @supabase/supabase-js socket.io socket.io-client
pnpm add @tanstack/react-query zod react-hook-form @hookform/resolvers
pnpm add @upstash/redis @upstash/ratelimit
pnpm add lucide-react class-variance-authority clsx tailwind-merge next-themes
pnpm add -D prisma @types/node vitest playwright

# Initialize Shadcn/ui
pnpm dlx shadcn-ui@latest init

# Install essential components
pnpm dlx shadcn-ui@latest add button input card dialog toast form label select

# Day 2: Database & Deployment Setup
# - Create Supabase project
# - Run database migrations (00-setup-database.sql to 04-seed-data.sql)
# - Create Vercel project
# - Link GitHub repository
# - Configure environment variables
```

### Sprint 1: Foundation (Week 1 - 5 days)

**Goal:** Authentication, basic UI, and event CRUD

- [ ] **Day 1-2:** Authentication
  - Supabase Auth integration
  - Login page
  - Session management
  - Role-based middleware
  - Protected routes

- [ ] **Day 3:** UI Foundation
  - Navbar with role-based menu
  - Sidebar (admin)
  - Theme toggle (light/dark)
  - Loading states
  - Error boundaries

- [ ] **Day 4-5:** Event Management (Basic)
  - Create event form
  - List events (with filters)
  - View event details
  - Edit event
  - Delete event (soft)

**Deliverable:** Working auth + basic event CRUD

---

### Sprint 2: Recurrence & Parsing (Week 2 - 5 days)

**Goal:** Event cloning with recurrence + name parsing

- [ ] **Day 1-2:** Event Recurrence
  - Clone endpoint (POST /api/admin/events/:id/clone)
  - Date calculation logic (data_ref + weeks * 7)
  - Clone modal UI
  - Preview dates before confirm
  - Test: Clone 4 weeks, verify dates

- [ ] **Day 3-5:** Name Parsing
  - Implement 6-step parsing pipeline (copy from PARSING_ALGORITHM_SPEC.md)
  - Public submission endpoint (POST /api/public/submit)
  - Public submission form
  - Parsing preview (client-side)
  - Server-side validation
  - Test: 20 cases (TC001-TC020)

**Deliverable:** Working recurrence + parsing with 95%+ accuracy

---

### Sprint 3: Check-in & Real-time (Week 3 - 5 days)

**Goal:** Real-time check-in with validation

- [ ] **Day 1:** Guest Search
  - Search endpoint (GET /api/portaria/search)
  - Fast search with indexes
  - Real-time search bar (debounce 300ms)
  - Display results with metadata

- [ ] **Day 2-3:** Check-in Logic
  - Check-in endpoint (POST /api/portaria/checkin)
  - Temporal validation (VIP limits)
  - Duplicate prevention (unique constraint)
  - Check-in feedback UI (fullscreen green/red)
  - Test: Validation scenarios

- [ ] **Day 4-5:** Real-time Sync
  - WebSocket server setup (Socket.io)
  - WebSocket client hooks
  - Room-based broadcasting (per event)
  - Offline queue (IndexedDB)
  - Auto-sync when online
  - Test: Multi-device sync

**Deliverable:** Working check-in with real-time sync

---

### Sprint 4: Approvals & Polish (Week 4 - 5 days)

**Goal:** Admin approvals + final polish

- [ ] **Day 1-2:** Submission Approvals
  - List pending submissions (admin dashboard)
  - Review modal (show parsed names)
  - Approve endpoint (bulk insert)
  - Reject endpoint (with reason)
  - Duplicate detection

- [ ] **Day 2-3:** Reports & Analytics
  - Check-in report endpoint
  - Report table UI
  - Export CSV
  - Basic analytics dashboard
  - Occupancy metrics

- [ ] **Day 4:** Testing & Bug Fixes
  - E2E tests (Playwright)
  - Performance testing
  - Mobile testing (real devices)
  - Bug fixes

- [ ] **Day 5:** Documentation & Deployment
  - API documentation (OpenAPI)
  - User guides (admin, doorstaff, promoter)
  - Deploy to production
  - Monitoring setup (Sentry)

**Deliverable:** Production-ready MVP

---

## NEXT STEPS

### Immediate Actions (Next 24 hours)

1. **Stakeholder Approval** (2 hours)
   - Review this architecture document
   - Approve technology stack
   - Confirm timelines (4 weeks realistic?)

2. **Project Setup** (2 hours)
   - Create GitHub repository
   - Initialize Next.js project
   - Setup Vercel + Supabase
   - Configure CI/CD

3. **Database Setup** (2 hours)
   - Run SQL migrations (7 tables)
   - Create seed data
   - Test connections
   - Configure RLS policies

4. **Team Onboarding** (2 hours)
   - Share documentation with team
   - Assign Sprint 1 tasks
   - Setup communication channels (Slack/Discord)
   - Schedule daily standups

### Development Kickoff (Week 1, Day 1)

- Morning: Sprint 1 planning meeting
- Afternoon: Start implementation (authentication)
- Daily: Standup at 9 AM, Demo at 5 PM (async)
- Friday: Sprint review + retrospective

---

## CONCLUSION

This architecture document provides a complete technical blueprint for building the VIP List Manager SaaS platform. The stack is:

- **Modern** - Latest versions of Next.js 14, React 18, TypeScript 5
- **Proven** - Supabase, Vercel, Socket.io are battle-tested
- **Scalable** - Designed to grow from 1 to 500+ venues
- **Mobile-First** - Every decision optimized for 375px viewport
- **Developer-Friendly** - Great DX with TypeScript, Zod, React Query

**Key Strengths:**

1. **Complete Specifications** - No ambiguity, ready to code
2. **Modern Stack** - All tools current and well-supported
3. **Performance-Focused** - Indexes, caching, edge functions
4. **Security-First** - RLS, rate limiting, input sanitization
5. **Real-time Ready** - WebSocket with offline fallback

**Confidence Level:** 90%

With this architecture and the existing documentation (DOCS_BUSINESS_LOGIC, PARSING_ALGORITHM_SPEC, etc.), a competent team can deliver the MVP in 4 weeks.

---

**Document Prepared By:** Staff Software Engineer / Tech Lead (Claude)
**Date:** 2025-11-23
**Status:** Ready for Implementation
**Next Review:** After Sprint 1 (Week 2)
**Approval Required:** CTO + Lead Developer

---

**References:**
- [DOCS_BUSINESS_LOGIC.md](./DOCS_BUSINESS_LOGIC.md) - Business requirements and user stories
- [DOCS_DESIGN_SYSTEM.md](./DOCS_DESIGN_SYSTEM.md) - UI components and styling
- [DOCS_UX_FLOW.md](./DOCS_UX_FLOW.md) - User flows and wireframes
- [DOCS_PROJECT_PLAN.md](./DOCS_PROJECT_PLAN.md) - Project management and sprints
- [API_REFERENCE.md](./API_REFERENCE.md) - API endpoint documentation
- [PARSING_ALGORITHM_SPEC.md](./PARSING_ALGORITHM_SPEC.md) - Name parsing implementation
- [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) - Development tasks
- [QUICK_START_DEV.md](./QUICK_START_DEV.md) - Developer onboarding guide
