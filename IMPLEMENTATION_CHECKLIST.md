# Checklist de Implementação - MVP
**Versão:** 1.0
**Data:** 2025-11-23
**Prioridade:** P1 (MVP Core)

---

## FASE 1: ARQUITETURA E BANCO DE DADOS (Semana 1)

### Database Schema
- [ ] Tabela `eventos_template` (com índices)
- [ ] Tabela `eventos_instancia` (com FK para template; **sem** `CHECK hora_fim > hora_inicio` — eventos noturnos cruzam meia-noite)
- [ ] Tabela `guest_records` (com unique constraint LOWER(nome))
- [ ] Tabela `guest_submissions` (com expiry)
- [ ] Tabela `check_in_records` (com unique constraint por evento)
- [ ] Tabela `boates` (master data)
- [ ] Tabela `users` (com role enum)
- [ ] Criar migrations Raw SQL (recomendado) ou Prisma
- [ ] Seed de dados (1 boate + 2 eventos + 10 guests de teste)
- [ ] Índices para performance (data_efetiva, evento_instancia_id, status)
- [ ] Índice para eventos ativos que cruzam meia-noite: `(boate_id, data_efetiva)` WHERE status = 'Ativo'

### API Routes Core
- [ ] `POST /api/admin/eventos` - Criar evento (template ou instância)
- [ ] `GET /api/admin/eventos` - Listar eventos com filtros
- [ ] `POST /api/admin/eventos/:id/clone` - Clonar com recorrência
- [ ] `GET /api/eventos/:id/guests` - Listar VIPs do evento
- [ ] `POST /api/submit-names` - Formulário público
- [ ] `GET /api/admin/submissions` - Listar pendentes
- [ ] `POST /api/admin/submissions/:id/approve` - Aprovar em lote
- [ ] `POST /api/portaria/checkin` - Check-in
- [ ] `GET /api/portaria/search?q=João` - Busca real-time

### Autenticação e Bootstrap
- [ ] Setup Supabase Auth (JWT + Row Level Security)
- [ ] Criação de roles: Admin, Portaria (Promoter não tem conta — acessa via link público)
- [ ] Middleware de autenticação + proteção de rotas por role
- [ ] **Bootstrap:** Script/CLI para criar primeiro Admin e primeira Boate
- [ ] Wizard de onboarding obrigatório no primeiro login (criação da Boate antes de acessar o dashboard)
- [ ] Rate limiting do check-in por `user_id` autenticado (não por IP) — via Upstash Redis

---

## FASE 2: FEATURE 1 - RECORRÊNCIA DE EVENTOS (Semana 1-2)

### User Story US-001: Criar Evento Único
**Backend:**
- [ ] Endpoint `POST /api/admin/eventos` validado
- [ ] Validation: Data >= hoje, Capacidade > 0, Hora válida
- [ ] Teste: Criar evento com dados válidos
- [ ] Teste: Rejeitar evento no passado
- [ ] Teste: Rejeitar evento com hora inválida

**Frontend (Mobile):**
- [ ] Tela: Form com campos (Nome, Data, Hora Início, Hora Fim, Capacidade)
- [ ] DatePicker mobile-friendly
- [ ] TimePicker (24h format)
- [ ] Validação client-side
- [ ] Feedback: Toast success + redirect para evento

---

### User Story US-002: Clonar Evento com Recorrência
**Backend:**
- [ ] Endpoint `POST /api/admin/eventos/:id/clone`
- [ ] Logic: Calcular data_efetiva = data_template + (semana_numero * 7 dias)
- [ ] Validation: Semanas futuras apenas
- [ ] Geração de semana_numero automático
- [ ] Teste: Clonar 4 semanas
- [ ] Teste: Validar que instâncias são independentes
- [ ] Teste: Deletar template não deleta instâncias

**Frontend (Mobile):**
- [ ] Modal: "Quantas semanas? [input 1-52]"
- [ ] Checkbox: "Manter horários?" | "Manter capacidade?"
- [ ] Listagem de eventos a criar (preview)
- [ ] Botão "Confirmar" com validação final
- [ ] Feedback: Toast "4 eventos clonados"

### Teste de Integração
- [ ] Criar template (15/11)
- [ ] Clonar em 4 semanas
- [ ] Validar instâncias:
  - [ ] Instância 1: 22/11 (15+7)
  - [ ] Instância 2: 29/11 (15+14)
  - [ ] Instância 3: 06/12 (15+21)
  - [ ] Instância 4: 13/12 (15+28)

---

## FASE 3: FEATURE 2 - PARSING E SUBMISSÃO (Semana 2)

### User Story US-004: Submeter Nomes via Textarea
**Backend:**
- [ ] Endpoint `POST /api/submit-names` (sem autenticação)
- [ ] Input validation: Max 500 nomes, Min 1
- [ ] Parsing pipeline implementado (vide DOCS_BUSINESS_LOGIC.md)
- [ ] Testes de parsing:
  - [ ] Remove emojis: "🔥 João" -> "João"
  - [ ] Remove números leading: "1- Maria" -> "Maria"
  - [ ] Title Case: "joão silva" -> "João Silva"
  - [ ] Remove espaços extras: "joão  silva" -> "João Silva"
  - [ ] Rejeita muito curto: "X" -> erro
  - [ ] Rejeita símbolos: "@Maria#" -> erro
  - [ ] Aceita acentos: "José" -> OK
  - [ ] Aceita hífens: "Jean-Paul" -> OK
- [ ] Detecção de duplicatas (case-insensitive)
- [ ] Rate limiting: Max 10 req por IP em 1h
- [ ] Sanitization: Prevenir SQL injection
- [ ] Guarda raw_text original para auditoria
- [ ] Status inicial: "Pendente"
- [ ] Expiry: 24h auto-delete

**Frontend (Mobile):**
- [ ] Tela: Seleção de evento (ou URL param ?evento_id=)
- [ ] Textarea com placeholder
- [ ] Validação client-side (não confiável)
- [ ] Botão "Enviar"
- [ ] Feedback:
  - [ ] Sucesso: "150 nomes recebidos. ID: ABC123"
  - [ ] Erro: "Limite 500 nomes" ou listagem de rejeitados
- [ ] Responsivo mobile

### Teste de Parsing (Matriz Completa)
```
| Input | Output | Status | Motivo |
|-------|--------|--------|--------|
| "🔥 João Silva" | "João Silva" | OK | Emoji removido |
| "1- Maria" | "Maria" | OK | Numeração removida |
| "(Carla)" | "Carla" | OK | Parênteses removidos |
| "pedro ferreira" | "Pedro Ferreira" | OK | Title Case |
| "Jean-Paul" | "Jean-Paul" | OK | Hífen mantido |
| "José de Oliveira" | "José De Oliveira" | OK | Acentos mantidos |
| "123João" | REJEITAR | Erro | Começa com número |
| "X" | REJEITAR | Erro | < 2 caracteres |
| "🔥🔥🔥" | REJEITAR | Erro | Só emojis |
| "" (vazio) | IGNORAR | Skip | Linha vazia |
```

---

## FASE 4: FEATURE 3 - CHECK-IN REAL-TIME (Semana 3)

### User Story US-006: Busca Rápida e Check-in
**Backend:**
- [ ] Endpoint `GET /api/portaria/search?q=João&evento_id=XYZ`
- [ ] Busca: Partial matching, case-insensitive
- [ ] Retorna: [{ id, nome, tipo_cliente, horario_limite }]
- [ ] Endpoint `POST /api/portaria/checkin`
  - [ ] Input: { guest_id, evento_id, timestamp }
  - [ ] Validação de horário:
    - [ ] Se VIP: horário_atual <= horario_vip_limite
    - [ ] Se Convidado: sem validação
  - [ ] Validação: Nenhum check-in duplicado
  - [ ] Snapshot: Salvar horários/tipo em check_in_record
  - [ ] Response: { status, mensagem, cor_feedback }
- [ ] WebSocket setup (Socket.io ou similar)
- [ ] Broadcast: check-in realizado para todos os portarias
- [ ] Teste: Check-in no horário permitido
- [ ] Teste: Bloquear check-in VIP fora de horário
- [ ] Teste: Permitir Convidado qualquer hora

**Frontend (Mobile):**
- [ ] Tela: Busca + Teclado numérico otimizado
- [ ] Input: Real-time search (debounce 300ms)
- [ ] Resultados: Listagem com nome, tipo, horário limite
- [ ] Click = Submit check-in
- [ ] Feedback Visual:
  - [ ] Verde + Som: Check-in válido
  - [ ] Vermelho: Fora do horário
  - [ ] Amarelo: Já fez check-in
- [ ] Auto-clear em 2s
- [ ] WebSocket listener para atualizações
- [ ] Modo offline: Cache local + "sync pending"

### Teste de Validação Horária
```
Evento: 23:00 - 05:00
VIP Limite: 00:30

| Horário | Tipo | Permitido? | Motivo |
|---------|------|-----------|--------|
| 23:15 | VIP | SIM | Antes do limite |
| 00:15 | VIP | SIM | Antes do limite |
| 00:30 | VIP | SIM | Exato no limite |
| 00:31 | VIP | NÃO | Depois do limite |
| 01:00 | VIP | NÃO | Muito tarde |
| 04:00 | VIP | NÃO | Muito tarde |
| 23:15 | Convidado | SIM | Sem limite |
| 04:00 | Convidado | SIM | Sem limite |
```

---

## FASE 5: APROVAÇÃO E RELATÓRIOS (Semana 3)

### User Story US-007: Relatório de Check-in
**Backend:**
- [ ] Endpoint `GET /api/portaria/relatorio?evento_id=XYZ&data=2025-11-23`
- [ ] Dados retornados: Nome, Horário Entrada, Status, Tipo Cliente
- [ ] Métricas: Total, Taxa Ocupação, Hora Pico
- [ ] Filtering: Por tipo, por status, por horário
- [ ] Export: CSV com download

**Frontend (Mobile):**
- [ ] Tela: Relatório em tempo real
- [ ] Grid: Nome | Entrada | Status
- [ ] Cards de métrica: Total | Ocupação % | Pico
- [ ] Auto-refresh a cada 5s
- [ ] Botão export CSV

### Admin - Aprovação de Submissões
**Backend:**
- [ ] Endpoint `POST /api/admin/submissions/:id/approve`
- [ ] Logic: Insere guest_records em lote
- [ ] Detecta duplicatas com guests já existentes
- [ ] Endpoint `POST /api/admin/submissions/:id/reject`

**Frontend (Mobile):**
- [ ] Dashboard: "5 Submissões Pendentes"
- [ ] Modal: Visualizar nomes
- [ ] Ações: Aprovar | Rejeitar | Editar (remover alguns)
- [ ] Toast: Feedback da ação

---

## FASE 6: INTEGRAÇÃO E TESTES (Semana 3)

### Testes Automatizados
- [ ] Unit tests: Parsing pipeline (Jest)
- [ ] Unit tests: Validação de horários
- [ ] Integration tests: Criar evento -> Clonar -> Adicionar guests
- [ ] E2E tests: Fluxo completo (Admin cria, Promoter submete, Portaria check-in)
- [ ] Teste de carga: 1000 check-ins simultâneos (WebSocket)
- [ ] Teste de segurança: Rate limiting, SQL injection, XSS

### Performance
- [ ] Busca em < 100ms (com índices DB)
- [ ] Check-in em < 500ms
- [ ] WebSocket latência < 1s

### Responsividade Mobile
- [ ] Testes em viewport 375px (iPhone SE)
- [ ] Testes em viewport 810px (iPad)
- [ ] Toque: Targets >= 44x44px
- [ ] Teclado: Suporte a autofill, numerais

---

## VALIDAÇÕES E CONSTRAINTS

### Validação de Entrada (Server-side)
- [ ] Nenhuma confiança em client-side
- [ ] Prepared statements obrigatório (Prisma, Sequelize)
- [ ] Sanitization de strings

### Rate Limiting (Por IP)
```
POST /api/submit-names: 10 req/hora
POST /api/portaria/checkin: 100 req/min
GET /api/portaria/search: Unlimited (local)
```

### Expiração de Dados
- [ ] Guest submission (pendente): 24h
- [ ] Check-in records: 90 dias
- [ ] Draft mode: 24h
- [ ] Sessão portaria: 8h

---

## CASOS DE TESTES CRÍTICOS

### TC-001: Recorrência Correta
```
DADO: Template com data_ref = 2025-11-15
QUANDO: Clone 4 semanas
ENTÃO: Instâncias com datas:
  - 22/11 (15+7)
  - 29/11 (15+14)
  - 06/12 (15+21)
  - 13/12 (15+28)
```

### TC-002: Parsing Robusto
```
DADO: "🔥 1- João   Silva (VIP)\n2- @Maria#"
QUANDO: Parse
ENTÃO: ["João Silva"] (1 válido, 1 rejeitado)
```

### TC-003: Check-in Bloqueado
```
DADO: VIP com horário limite 00:30
  QUANDO: Check-in às 00:31
ENTÃO: "Bloqueado. VIP até 00:30"
```

### TC-004: Duplicação Detectada
```
DADO: Submissão "João Silva" (já existe)
QUANDO: Parse
ENTÃO: Aviso "João Silva já cadastrado"
```

### TC-005: Sincronização Real-time
```
DADO: 2 Portarias abertas
QUANDO: Portaria A faz check-in
ENTÃO: Portaria B vê atualização em < 1s
```

---

## DOCUMENTAÇÃO TÉCNICA

- [ ] README.md com setup do projeto
- [ ] Arquitetura: Diagrama de componentes
- [ ] API Docs: Swagger/OpenAPI
- [ ] Database: ER Diagram
- [ ] Algoritmo: Pseudo-código bem documentado
- [ ] Variáveis de ambiente (.env.example)
- [ ] Scripts de deploy

---

## LANÇAMENTO MVP

### Pre-Lançamento
- [ ] Testes em staging
- [ ] Dados de teste (boate fictícia)
- [ ] Manual de uso (Admin, Promoter, Portaria)
- [ ] Suporte básico

### Go-Live
- [ ] Backup do banco
- [ ] Monitoramento (logs, erros)
- [ ] Feature flags para rollback rápido

---

## PRIORIZAÇÃO

**P0 (Blocker):**
1. Criar evento único
2. Parsing de nomes
3. Check-in com validação de horário

**P1 (Must-Have MVP):**
4. Recorrência semanal
5. Formulário público
6. Aprovação de submissões
7. Relatório básico

**P2 (Nice-to-Have):**
8. Modo offline
9. Integração com catraca
10. Gráficos avançados

---

## MÉTRICAS DE SUCESSO

- Taxa de sucesso de parsing: > 95%
- Latência check-in: < 500ms (p95)
- Latência busca: < 100ms
- Disponibilidade: > 99%
- Satisfação Admin: NPS > 7

---

**Atualização:** 2025-11-23
**Próximo review:** Após Fase 1
