# PROJECT PLAN - VIP List Manager SaaS
**Versao:** 2.0
**Data:** 2025-11-23
**Status:** Em Planejamento e Desenvolvimento
**Metodologia:** Agile Scrum
**Duracao Estimada MVP:** 4 semanas (3 features core)

---

## 1. VISAO GERAL DO PROJETO

### Objetivo
Sistema SaaS mobile-first para gestao automatizada de listas VIP em casas noturnas, com foco em:
1. Recorrencia de eventos (clonagem automatica semanal)
2. Parsing inteligente de nomes (150+ nomes sujos)
3. Check-in real-time com validacao horaria

### Proposta de Valor
- Check-in < 1 segundo (vs 30s+ manual)
- Parsing automatico remove 95%+ dos erros
- Eventos recorrentes gerados automaticamente
- Link publico sem autenticacao
- Sincronizacao real-time entre portarias

### Usuarios-Alvo
1. **Admin/Manager** - Cria eventos e aprova submissoes
2. **Portaria** - Check-in mobile rapido
3. **Promoter** - Submete nomes via link publico (sem login)

---

## 2. EPICS E ESTRUTURA

### EPIC 1: Autenticacao e Controle de Acesso
**Objetivo:** Base de seguranca com roles (Admin, Portaria, Promoter)
**Prioridade:** P0 (Bloqueador)

### EPIC 2: Recorrencia de Eventos
**Objetivo:** Template vs Instancia - clonar eventos em N semanas
**Prioridade:** P0 (MVP Core)

### EPIC 3: Parsing Inteligente e Submissao Publica
**Objetivo:** Textarea com 500+ nomes, limpeza automatica (6 passos)
**Prioridade:** P0 (MVP Core)

### EPIC 4: Check-in Real-time
**Objetivo:** Busca instantanea + validacao horaria + sincronizacao
**Prioridade:** P0 (MVP Core)

### EPIC 5: Gestao de Listas e Aprovacoes
**Objetivo:** Admin aprova submissoes, gerencia convidados
**Prioridade:** P1 (Must-Have)

### EPIC 6: UI/UX Mobile-First
**Objetivo:** Interface responsiva otimizada para smartphone
**Prioridade:** P0 (Transversal)

---

## 3. USER STORIES DETALHADAS

---

## EPIC 1: AUTENTICACAO E CONTROLE DE ACESSO

### US-001: Login com NextAuth/Supabase
**Como** admin/portaria
**Quero** fazer login com email/senha
**Para** acessar sistema de forma segura

**Prioridade:** P0 (Bloqueador)
**Story Points:** 5
**Sprint:** 1

**Criterios de Aceite:**
- [ ] Pagina /login responsiva
- [ ] Validacao email valido + senha min 8 chars
- [ ] Mensagem erro clara
- [ ] Redirect para /dashboard apos login
- [ ] Sessao persistente (JWT)
- [ ] Botao "Esqueci senha" funcional

**Testes:**
- Login invalido -> erro
- Login valido -> redirect /dashboard
- Refresh pagina -> sessao mantida

**Definicao de Done:**
- Implementado e funcionando
- Testes E2E escritos
- Code review aprovado
- Responsivo (375px, 768px, 1920px)
- Deploy em staging

---

### US-002: Controle de Permissoes por Role
**Como** sistema
**Quero** aplicar permissoes por role (Admin/Portaria/Promoter)
**Para** restringir acoes conforme hierarquia

**Prioridade:** P0
**Story Points:** 8
**Sprint:** 1

**Criterios de Aceite:**
- [ ] Tabela users com campo role (admin/portaria/promoter)
- [ ] Middleware valida permissoes em rotas protegidas
- [ ] Admin: acesso total
- [ ] Portaria: somente check-in e busca
- [ ] Promoter: somente submissao publica (sem login)
- [ ] Acesso nao autorizado -> HTTP 403

**Regras de Permissao:**
```typescript
Admin -> CRUD(tudo)
Portaria -> READ(eventos, listas, guests) + UPDATE(check_in)
Promoter -> POST(submit-names) via link publico
```

**Testes:**
- Portaria tenta deletar lista -> 403
- Admin edita qualquer coisa -> 200
- Promoter acessa link publico -> 200 (sem login)

---

## EPIC 2: RECORRENCIA DE EVENTOS

### US-101: Criar Evento Template
**Como** admin
**Quero** criar evento base com data referencia
**Para** usar como modelo para clonagem recorrente

**Prioridade:** P0
**Story Points:** 8
**Sprint:** 1-2

**Criterios de Aceite:**
- [ ] Formulario com campos: Nome, Data Referencia, Hora Inicio/Fim, Hora VIP Limite, Capacidade
- [ ] Validacao: data >= hoje, capacidade >= 1, hora_fim > hora_inicio
- [ ] Salva com is_template = true
- [ ] Feedback: "Evento template criado! ID: ABC123"

**Schema:**
```sql
eventos_template {
  id: uuid PRIMARY KEY,
  nome: varchar(255),
  data_referencia: date,
  hora_inicio: time,
  hora_fim: time,
  hora_vip_limite: time,
  capacidade: int,
  tipo_cliente: enum('VIP', 'Convidado', 'Misto'),
  boate_id: uuid,
  status: enum('Ativo', 'Inativo')
}
```

**Testes:**
- Criar evento valido -> salvo
- Data no passado -> erro
- Hora invalida -> erro

---

### US-102: Clonar Evento em N Semanas
**Como** admin
**Quero** clonar template em 4 semanas
**Para** nao recriar eventos manualmente

**Prioridade:** P0
**Story Points:** 13
**Sprint:** 2

**Criterios de Aceite:**
- [ ] Modal "Quantas semanas?" [1-52]
- [ ] Opcoes: Manter horarios? Manter capacidade?
- [ ] Cada clone = instancia independente
- [ ] Calculo automatico: data_efetiva = data_ref + (semana_numero * 7 dias)
- [ ] Nao cria duplicatas (valida se instancia ja existe)
- [ ] Feedback: "4 eventos criados: 22/11, 29/11, 06/12, 13/12"

**Schema:**
```sql
eventos_instancia {
  id: uuid PRIMARY KEY,
  template_id: uuid REFERENCES eventos_template(id),
  nome: varchar(255),
  data_efetiva: date,
  semana_numero: int,
  hora_inicio: time,
  hora_fim: time,
  hora_vip_limite: time,
  capacidade: int,
  status: enum('Ativo', 'Cancelado', 'Finalizado')
}
```

**Regra de Negocio RN-001: Template vs Instancia**
- Template = evento base com data referencia
- Instancia = clone concreto em data especifica
- Deletar template NAO deleta instancias (orphaning permitido)
- Modificar template NAO afeta instancias ja criadas

**Testes:**
- Template 15/11 clonado 4 semanas -> instancias 22/11, 29/11, 06/12, 13/12
- Cada instancia lista independente
- Deletar template -> instancias permanecem

---

### US-103: Editar Instancia sem Afetar Modelo
**Como** admin
**Quero** editar instancia especifica
**Para** customizar eventos especiais sem alterar padrao

**Prioridade:** P1
**Story Points:** 5
**Sprint:** 2

**Criterios de Aceite:**
- [ ] Formulario identifica se e modelo ou instancia
- [ ] Se instancia, alteracoes vao para campo overrides (JSONB)
- [ ] Se modelo, aviso: "Alterar modelo nao afeta instancias ja criadas"
- [ ] Exemplo: mudar nome para "Festa Halloween"

**Testes:**
- Editar instancia 15/11 -> nome alterado apenas nessa data
- Verificar instancia 22/11 -> mantém nome original

---

## EPIC 3: PARSING INTELIGENTE E SUBMISSAO PUBLICA

### US-201: Submeter Nomes via Textarea (Link Publico)
**Como** promoter
**Quero** colar 150+ nomes com emojis/numeracao
**Para** enviar lista rapidamente sem login

**Prioridade:** P0
**Story Points:** 13
**Sprint:** 2

**Criterios de Aceite:**
- [ ] Rota publica: POST /api/submit-names (SEM autenticacao)
- [ ] Textarea grande (min 10 linhas, max 500 nomes)
- [ ] Parsing automatico 6 passos:
  1. Split em linhas
  2. Remove emojis (Unicode ranges)
  3. Remove numeracao leading (1-, 001., etc)
  4. Remove caracteres especiais (preserva acentos)
  5. Normaliza espacos (trim, colapso)
  6. Title Case (capitalizacao)
- [ ] Validacoes:
  - Min 2 chars, Max 100 chars
  - Padrao: /^[a-zA-ZA-ÿ\s\-']+$/
  - Sem numeros
  - Deduplicacao case-insensitive
- [ ] Rate limiting: Max 10 req por IP em 1h
- [ ] CAPTCHA se > 100 nomes
- [ ] Feedback: "142 nomes recebidos. ID: ABC-123. Enviado para aprovacao."

**Exemplo Input:**
```
🔥 Joao Silva
1- Maria Santos
(Carla Oliveira)
pedro ferreira
```

**Exemplo Output:**
```
["Joao Silva", "Maria Santos", "Carla Oliveira", "Pedro Ferreira"]
```

**Regra de Negocio RN-003: Parsing 3 Regras**
1. Normalizacao: Remove emojis, numeros leading, simbolos
2. Capitalizacao: Title Case
3. Deduplicacao: Case-insensitive

**Schema:**
```sql
guest_submissions {
  id: uuid PRIMARY KEY,
  evento_instancia_id: uuid,
  raw_text: text,
  parsed_names: jsonb,
  submission_ip: inet,
  status: enum('Rascunho', 'Pendente', 'Aprovado', 'Rejeitado'),
  expires_at: timestamp (created_at + 24h),
  created_at: timestamp
}
```

**Testes (Matriz Completa TC001-TC020):**
- "🔥 Joao Silva" -> "Joao Silva"
- "1- Maria" -> "Maria"
- "(Carla)" -> "Carla"
- "pedro ferreira" -> "Pedro Ferreira"
- "Jean-Paul O'Brien" -> "Jean-Paul O'Brien" (hifen mantido)
- "X" -> REJEITAR (< 2 chars)
- "@Maria#" -> REJEITAR (caracteres invalidos)
- "Joao123" -> REJEITAR (numeros)

---

### US-202: Admin Aprova Submissao
**Como** admin
**Quero** revisar e aprovar nomes submetidos
**Para** validar antes de adicionar a lista

**Prioridade:** P1
**Story Points:** 8
**Sprint:** 3

**Criterios de Aceite:**
- [ ] Dashboard: "5 Submissoes Pendentes"
- [ ] Modal visualiza nomes parseados
- [ ] Acoes: Aprovar (bulk add) | Rejeitar | Editar (remover alguns)
- [ ] Detecta duplicatas com guests ja existentes
- [ ] Feedback: "142 nomes adicionados a lista"

**Schema:**
```sql
guest_records {
  id: uuid PRIMARY KEY,
  evento_instancia_id: uuid,
  nome: varchar(255),
  tipo_cliente: enum('VIP', 'Convidado'),
  source: enum('Manual', 'Import', 'Submission'),
  submission_id: uuid,
  status: enum('Pendente', 'Aprovado', 'Rejeitado', 'Presente'),
  created_at: timestamp
}
```

**Testes:**
- Aprovar submissao -> nomes inseridos em guest_records
- Rejeitar submissao -> status='Rejeitado'
- Editar (remover 3 nomes) -> aprovar 7 de 10

---

## EPIC 4: CHECK-IN REAL-TIME

### US-301: Busca Instantanea de Convidados
**Como** portaria
**Quero** buscar convidado por nome em tempo real
**Para** encontrar rapidamente na lista

**Prioridade:** P0
**Story Points:** 8
**Sprint:** 3

**Criterios de Aceite:**
- [ ] GET /api/portaria/search?q=Joao&evento_id=XYZ
- [ ] Busca case-insensitive, partial matching
- [ ] Resultados limitados a 20 primeiros
- [ ] Exibe: Nome, Tipo Cliente, Horario Limite
- [ ] Latencia < 100ms (P95)
- [ ] Debounce 300ms no input

**Query Otimizada:**
```sql
SELECT c.nome, c.tipo_cliente, e.hora_vip_limite
FROM guest_records c
JOIN eventos_instancia e ON c.evento_instancia_id = e.id
WHERE LOWER(c.nome) LIKE LOWER('%joao%')
  AND c.evento_instancia_id = 'XYZ'
  AND c.status = 'Aprovado'
ORDER BY c.nome
LIMIT 20
```

**Testes:**
- Buscar "joao" -> ["Joao Silva", "Joao Pedro"]
- Buscar "xyz" -> []
- Evento com 2000 guests -> busca < 100ms

---

### US-302: Check-in com Validacao Horaria
**Como** portaria
**Quero** fazer check-in clicando no convidado
**Para** registrar entrada com validacao automatica

**Prioridade:** P0
**Story Points:** 13
**Sprint:** 3

**Criterios de Aceite:**
- [ ] POST /api/portaria/checkin
- [ ] Body: { guest_id, evento_id, timestamp }
- [ ] Validacoes:
  - VIP: horario_atual <= horario_vip_limite
  - Convidado: sem restricao
  - Nao permite check-in duplicado
- [ ] Se aprovado:
  - Atualiza checked_in=true, checked_in_at=NOW()
  - Feedback: "Joao Silva - Entrada confirmada ✓" (VERDE)
- [ ] Se bloqueado:
  - Mensagem: "VIP ate 00:30, agora e 01:00" (VERMELHO)
  - Botao "Forcar Entrada" (somente Admin)

**Regra de Negocio RN-002: Horarios VIP Rigidos**
- VIP pode entrar ate horario_vip_limite (ex: 00:30)
- Convidado sem restricao temporal
- Validacao no cliente (portaria) + servidor
- Timezone: America/Sao_Paulo

**Schema:**
```sql
check_in_records {
  id: uuid PRIMARY KEY,
  guest_id: uuid,
  evento_instancia_id: uuid,
  timestamp_entrada: timestamp,
  horario_vip_limite: time (snapshot),
  tipo_cliente: enum('VIP', 'Convidado') (snapshot),
  portaria_user_id: uuid,
  status: enum('Presente', 'Saida'),
  UNIQUE(guest_id, evento_instancia_id)
}
```

**Testes (Validacao Horaria):**
```
Evento: 23:00 - 05:00
VIP Limite: 00:30

Teste 1: 23:15 + VIP = OK ✓
Teste 2: 00:30 + VIP = OK ✓
Teste 3: 00:31 + VIP = BLOQUEADO ✗
Teste 4: 04:00 + Convidado = OK ✓
```

---

### US-303: Sincronizacao Real-time (WebSocket)
**Como** sistema
**Quero** sincronizar check-ins entre portarias
**Para** evitar entradas duplicadas

**Prioridade:** P0
**Story Points:** 13
**Sprint:** 3

**Criterios de Aceite:**
- [ ] WebSocket setup (Socket.io ou similar)
- [ ] Broadcast: check-in realizado para todos os clientes
- [ ] Latencia < 1s ideal
- [ ] Fallback: Polling 2s se WebSocket cair
- [ ] Cache local em portaria (modo offline)

**Regra de Negocio RN-005: Sincronizacao Real-Time**
- Prioridade: Latencia < 1s
- Tecnologia: WebSocket + fallback polling
- Eventos sincronizados: Check-in, remocao, atualizacao status
- Modo offline: Cache local + mark "sync pending"

**Testes:**
- Portaria A faz check-in -> Portaria B ve atualizacao < 1s
- WebSocket cai -> fallback polling 2s ativo
- Modo offline -> cache local usado

---

### US-304: Prevencao de Check-in Duplicado (Race Condition)
**Como** sistema
**Quero** prevenir check-in simultaneo do mesmo guest
**Para** evitar duas portarias marcarem a mesma pessoa

**Prioridade:** P0
**Story Points:** 8
**Sprint:** 3

**Criterios de Aceite:**
- [ ] Lock otimista no banco (usando updated_at)
- [ ] Primeira requisicao vence (FIFO)
- [ ] Segunda requisicao retorna erro: "Check-in ja realizado"
- [ ] Testes de carga: 10 req simultaneas -> apenas 1 sucesso

**Implementacao:**
```sql
UPDATE guest_records
SET checked_in = true, checked_in_at = NOW(), updated_at = NOW()
WHERE id = ? AND updated_at = ?
RETURNING *;

-- Se retornou 0 rows -> conflito
```

---

## EPIC 5: GESTAO DE LISTAS E APROVACOES

### US-401: Criar Lista por Tipo
**Como** admin
**Quero** criar lista vinculada a evento
**Para** organizar categorias de convidados

**Prioridade:** P1
**Story Points:** 8
**Sprint:** 2

**Criterios de Aceite:**
- [ ] Formulario: Nome, Tipo (VIP/Amiga/Aniversario), Evento
- [ ] Gera automaticamente public_token (UUID v4)
- [ ] Validacao: nome obrigatorio, tipo obrigatorio

**Schema:**
```sql
listas {
  id: uuid PRIMARY KEY,
  name: varchar(255),
  type: enum('VIP', 'Amiga', 'Aniversario'),
  status: enum('ativa', 'inativa'),
  evento_instancia_id: uuid,
  public_token: uuid UNIQUE,
  created_at: timestamp
}
```

---

### US-402: Gerar Link Publico com Token
**Como** admin
**Quero** gerar link publico para lista
**Para** enviar a promoter sem dar acesso ao sistema

**Prioridade:** P0
**Story Points:** 5
**Sprint:** 2

**Criterios de Aceite:**
- [ ] Link gerado automaticamente ao criar lista
- [ ] Formato: https://app.exemplo.com/submit/{evento_id}/{lista_id}/{token}
- [ ] Botao "Copiar Link" com feedback
- [ ] Botao "Regenerar Token" invalida link antigo

**Regra de Negocio RN-009: Seguranca Formulario Publico**
- Rate limiting: Max 10 submissoes por IP em 1h
- CAPTCHA para blocos grandes (500 nomes)
- Validacao server-side obrigatoria
- Sanitizacao: Prepared statements

---

## EPIC 6: UI/UX MOBILE-FIRST

### US-601: Design System com Tailwind + Shadcn
**Como** desenvolvedor
**Quero** componentes reutilizaveis consistentes
**Para** acelerar desenvolvimento

**Prioridade:** P0
**Story Points:** 13
**Sprint:** 1

**Criterios de Aceite:**
- [ ] Setup Tailwind CSS
- [ ] Instalacao Shadcn (Button, Input, Card, etc)
- [ ] Paleta cores tema dark/light
- [ ] Tipografia responsiva mobile-first

---

### US-602: Navbar Responsiva com Role
**Como** usuario
**Quero** menu navegacao adaptado ao meu role
**Para** acessar apenas funcionalidades permitidas

**Prioridade:** P0
**Story Points:** 5
**Sprint:** 1

**Criterios de Aceite:**
- [ ] Navbar fixa no topo
- [ ] Menu adaptado por role:
  - Admin: Eventos, Listas, Usuarios
  - Portaria: Check-in
- [ ] Menu hamburguer em mobile (<768px)

---

### US-603: Paginas Responsivas (375px a 1920px)
**Como** usuario
**Quero** usar sistema em qualquer dispositivo
**Para** ter experiencia consistente

**Prioridade:** P0
**Story Points:** 21
**Sprint:** 1-6 (todas)

**Criterios de Aceite:**
- [ ] Todas paginas testadas em:
  - Mobile: 375px (iPhone SE)
  - Tablet: 768px (iPad)
  - Desktop: 1920px
- [ ] Formularios campos grandes (min-height: 48px)
- [ ] Botoes area toque minima (44x44px)

---

## 4. CRONOGRAMA DE SPRINTS (4 SEMANAS)

### Sprint 1 (Semana 1): Fundacao
**Objetivo:** Autenticacao + Setup inicial

**Stories:**
- US-001: Login (5 pts)
- US-002: Permissoes (8 pts)
- US-601: Design System (13 pts)
- US-602: Navbar (5 pts)

**Total:** 31 pts
**Entrega:** Sistema com login funcional

---

### Sprint 2 (Semana 2): Recorrencia + Parsing
**Objetivo:** Core features 1 e 2

**Stories:**
- US-101: Criar Template (8 pts)
- US-102: Clonar em N Semanas (13 pts)
- US-103: Editar Instancia (5 pts)
- US-201: Submeter Nomes (13 pts)
- US-401: Criar Lista (8 pts)
- US-402: Link Publico (5 pts)

**Total:** 52 pts
**Entrega:** Eventos recorrentes + Parsing funcional

---

### Sprint 3 (Semana 3): Check-in Real-time
**Objetivo:** Core feature 3

**Stories:**
- US-301: Busca Instantanea (8 pts)
- US-302: Check-in Validacao (13 pts)
- US-303: Sincronizacao WebSocket (13 pts)
- US-304: Prevencao Race Condition (8 pts)
- US-202: Admin Aprova Submissao (8 pts)

**Total:** 50 pts
**Entrega:** Check-in funcional

---

### Sprint 4 (Semana 4): Polimento e Testes
**Objetivo:** Refinamento e preparacao producao

**Stories:**
- Testes E2E (13 pts)
- Ajustes Performance (8 pts)
- Loading States (5 pts)
- Documentacao Usuario (5 pts)

**Total:** 31 pts
**Entrega:** MVP pronto para producao

---

## 5. DEFINITION OF DONE (DoD)

Uma User Story e considerada **DONE** quando:

- [ ] Codigo implementado e funcionando
- [ ] Testes unitarios escritos (cobertura min 70%)
- [ ] Testes E2E para fluxos criticos
- [ ] Code review aprovado por Tech Lead
- [ ] Responsivo (375px, 768px, 1920px)
- [ ] Sem erros console
- [ ] Performance < 1s carregamento (P95)
- [ ] Documentacao atualizada
- [ ] Deploy em staging
- [ ] Aprovado pelo Product Owner (Demo)

---

## 6. RISCOS E MITIGACOES

| Risco | Impacto | Probabilidade | Mitigacao |
|-------|---------|---------------|-----------|
| **Supabase downtime durante evento** | ALTO | BAIXA | Cache local listas (30min), fallback modo leitura |
| **Performance ruim com 2000+ guests** | ALTO | MEDIA | Indices banco, paginacao, busca otimizada |
| **Link publico vazado** | MEDIO | ALTA | Token regeneravel, rate limiting, logs acesso |
| **Race condition em check-in** | ALTO | MEDIA | Lock otimista, testes carga |
| **Taxa parsing < 95%** | ALTO | MEDIA | Testes extensivos 20 casos, regex refinado |

---

## 7. METRICAS DE SUCESSO DO MVP

| Metrica | Meta | Medicao |
|---------|------|---------|
| **Taxa Parsing Valido** | > 95% | Logs parsing |
| **Latencia Check-in** | < 500ms (P95) | Logs performance |
| **Latencia Busca** | < 100ms | Logs performance |
| **Sync Real-time** | < 1s | WebSocket latency |
| **Uptime** | > 99.5% | Monitoramento |
| **NPS Admin** | > 7/10 | Pesquisa usuarios |

---

## 8. STACK TECNOLOGICA

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + Shadcn UI
- React Hook Form + Zod

**Backend:**
- Next.js API Routes
- Supabase (Auth + Database + Realtime)
- PostgreSQL (via Supabase)
- Socket.io (WebSocket)

**Infraestrutura:**
- Vercel (Deploy)
- Supabase (Database + Auth)
- Redis (Rate limiting) - Upstash

**Ferramentas:**
- ESLint + Prettier
- Vitest (Testes unitarios)
- Playwright (Testes E2E)
- GitHub Actions (CI/CD)

---

## 9. PROXIMOS PASSOS

**Responsavel:** Tech Lead
**Acao:**
1. Validar stack tecnologica com equipe
2. Setup repositorio e ambiente desenvolvimento
3. Criar schema banco dados (SQL migrations)
4. Definir estrutura pastas projeto
5. Kickoff Sprint 1

**Bloqueios:** Aguardando aprovacao Business Analyst

---

## 10. REFERENCIAS DOCUMENTACAO

- **DOCS_BUSINESS_LOGIC.md** - Requisitos core + User Stories + Fluxos
- **IMPLEMENTATION_CHECKLIST.md** - Checklist dev + Casos teste
- **ARCHITECTURE_DIAGRAMS.md** - Arquitetura + Diagramas + Tech Stack
- **PARSING_ALGORITHM_SPEC.md** - Algoritmo + Implementacao + Testes
- **EXECUTIVE_SUMMARY.md** - Resumo stakeholders + Financeiro
- **README_SPECIFICATION.md** - Indice mestre + Como usar
- **QUICK_START_DEV.md** - Guia rapido para desenvolvedores

---

**Documento criado por:** Project Manager Agent (Claude)
**Ultima atualizacao:** 2025-11-23
**Status:** Aguardando aprovacao para inicio desenvolvimento
