# Especificação SaaS - Gestão de Listas VIP Casa Noturna
**Versão:** 1.0 MVP
**Data:** 2025-11-23
**Status:** Pronto para Desenvolvimento

---

## VISÃO GERAL DO PROJETO

Sistema SaaS mobile-first para gestão de listas VIP em casas noturnas com 3 funcionalidades core:

1. **Recorrência de Eventos** - Admin clona eventos semanais com um clique
2. **Parsing Inteligente** - Textarea aceita 150+ nomes sujos, limpa automaticamente
3. **Check-in Real-time** - Portaria busca e valida VIP em tempo real com sincronização

---

## DOCUMENTAÇÃO ENTREGUE

### 1. DOCS_BUSINESS_LOGIC.md (28KB)
**Documento principal de requisitos de negócio**

Conteúdo:
- Visão geral e premissas
- 7 User Stories detalhadas (Admin, Promoter, Portaria)
- 4 Fluxos críticos com diagrama ASCII
- 9 Regras de Negócio
- Algoritmo de parsing com exemplos
- Modelo de dados (7 tabelas, relações ERD)
- 5 Casos de Uso estendidos
- Roadmap de 3 fases

**Seções principais:**
- US-001 a US-007: Cada user story com critérios de aceitação e edge cases
- RN-001 a RN-009: Regras de negócio críticas
- Modelo ER simplificado com constraints
- Pipeline de parsing com 6 passos

**Para quem:** Product Manager, Tech Lead, Stakeholders
**Tempo leitura:** 30-40 min

---

### 2. IMPLEMENTATION_CHECKLIST.md (11KB)
**Checklist executável de desenvolvimento**

Conteúdo:
- Fases 1-6 de implementação (4 semanas)
- Tarefas granulares por feature
- Testes de integração específicos
- 20+ casos de teste críticos (TC-001 a TC-005)
- Matriz de validação de parsing
- Métricas de sucesso (latência, taxa parsing, NPS)
- Priorização (P0, P1, P2)

**Checklist pronto para GitHub Projects:**
```
FASE 1: Arquitetura e BD (Semana 1)
  [x] Tabelas: eventos_template, eventos_instancia, guest_records, ...
  [ ] API routes core (9 endpoints)
  [ ] Autenticação com roles

FASE 2: Recorrência (Semana 1-2)
  [ ] US-001: Criar evento único
  [ ] US-002: Clonar com recorrência
  [ ] Validações de data/hora

...e mais 16 seções de trabalho
```

**Para quem:** Dev Team, QA, Scrum Master
**Tempo:** 1 semana de desenvolvimento por fase

---

### 3. ARCHITECTURE_DIAGRAMS.md (41KB)
**Diagramas técnicos e arquitetura**

Conteúdo:
- Arquitetura geral (Client → API → DB)
- 4 Diagramas de fluxo (ASCII)
- 3 Sequências de operações (UML simplificado)
- Componentes frontend (layouts mobile mockup)
- Infraestrutura e stack proposto
- Deployment flow (CI/CD)
- Scaling strategy (MVP → Enterprise)

**Diagramas inclusos:**
1. Fluxo 1: Criar evento recorrente (passo a passo)
2. Fluxo 2: Submeter nomes em massa (parsing detalhado)
3. Fluxo 3: Check-in na portaria (validação horária)
4. Fluxo 4: Aprovação de submissão (admin workflow)

**Tech Stack Recomendado:**
```
Frontend: React 18 + TailwindCSS + Socket.io
Backend: Node.js + Express/Next.js API + Prisma
Database: PostgreSQL 15 + Redis 7
Infra: Docker, GitHub Actions, AWS/Vercel
```

**Para quem:** Arquiteto, Tech Lead, Backend/Frontend
**Tempo:** 20-30 min

---

### 4. EXECUTIVE_SUMMARY.md (8KB)
**Resumo executivo para stakeholders**

Conteúdo:
- Problema + Solução
- Modelo de negócio (Pricing: R$ 299-999/mês)
- 3 Personas e casos de uso
- Roadmap de 3 fases (4 semanas MVP)
- Métricas de sucesso (parsing > 95%, latência < 500ms)
- Análise de risco (4 riscos + mitigação)
- Financeiro: Custos + Receita projetada
- Plano de lançamento (11 semanas)
- Próximos passos (validação + prototipagem)

**Highlights:**
- Break-even em mês 8-9
- Target: 30+ boates em ano 1
- Diferenciais: Mobile-first, Real-time, Validação temporal

**Para quem:** CEO, CFO, Investors, Product Lead
**Tempo:** 10-15 min

---

### 5. PARSING_ALGORITHM_SPEC.md (15KB)
**Especificação técnica do algoritmo**

Conteúdo:
- Visão geral do pipeline
- 6 passos de normalização (com regex)
- 5 regras de validação
- Implementação TypeScript completa (200+ linhas)
- Matriz de 20 casos de teste (TC001-TC020)
- Benchmark de performance
- Tratamento de erros
- Changelog

**Pipeline de Limpeza:**
```
1. Split em linhas
2. Remover emojis (Unicode ranges)
3. Remover numeração leading (1-, 001., etc)
4. Remover caracteres especiais (preservar acentos)
5. Normalizar espaços (trim, colapso)
6. Title Case (capitalização)
```

**Exemplos de Parsing:**
- "🔥 João Silva" → "João Silva" ✓
- "1- Maria Santos" → "Maria Santos" ✓
- "@Maria#" → REJEITAR ✗
- "João Silva\njoão silva" → ["João Silva"] (duplicado detectado) ✓

**Para quem:** Dev Backend, QA Tester
**Tempo:** 30-40 min

---

## COMO USAR ESTA DOCUMENTAÇÃO

### Onboarding do Time (Dia 1)
1. CEO/PM: Ler EXECUTIVE_SUMMARY.md (10 min)
2. Tech Lead: Ler DOCS_BUSINESS_LOGIC.md (40 min) + ARCHITECTURE_DIAGRAMS.md (20 min)
3. Devs: Ler IMPLEMENTATION_CHECKLIST.md (20 min) + PARSING_ALGORITHM_SPEC.md (30 min)

**Tempo total:** ~2 horas para 100% alignment

### Setup do Projeto (Dia 2)
1. Copiar IMPLEMENTATION_CHECKLIST.md para GitHub Projects
2. Criar 4 sprints (Semana 1, 2, 3, Teste)
3. Adicionar tasks conforme priorização (P0 → P1 → P2)

### Desenvolvimento (Semana 1-4)
1. Dev: Implementar conforme checklist
2. QA: Validar com casos de teste em DOCS_BUSINESS_LOGIC.md
3. Tech Lead: Review com arquitetura em ARCHITECTURE_DIAGRAMS.md
4. Parsing: Usar PARSING_ALGORITHM_SPEC.md como spec exata

### Validação (Semana 5)
1. Tester: Rodar matriz de testes completa (20 casos)
2. PM: Validar critérios de aceitação das user stories
3. Stakeholder: Testar com 2-3 boates piloto

---

## ESTRUTURA DE PASTAS RECOMENDADA

```
gerenciador-de-listas/
├── docs/
│   ├── DOCS_BUSINESS_LOGIC.md          ← Requisitos
│   ├── IMPLEMENTATION_CHECKLIST.md     ← Checklist dev
│   ├── ARCHITECTURE_DIAGRAMS.md        ← Arquitetura
│   ├── PARSING_ALGORITHM_SPEC.md       ← Algoritmo
│   ├── EXECUTIVE_SUMMARY.md            ← Stakeholders
│   └── README_SPECIFICATION.md         ← Este arquivo
├── src/
│   ├── api/
│   │   ├── admin/
│   │   │   └── eventos.ts
│   │   ├── portaria/
│   │   │   ├── checkin.ts
│   │   │   └── search.ts
│   │   └── submit/
│   │       └── names.ts
│   ├── lib/
│   │   ├── parsing.ts                  ← Implementar com spec
│   │   ├── validation.ts
│   │   └── utils.ts
│   ├── db/
│   │   ├── schema.ts                   ← Tabelas definidas em docs
│   │   └── migrations/
│   └── components/
│       ├── admin/
│       ├── portaria/
│       └── public/
├── tests/
│   ├── parsing.test.ts                 ← Casos de teste TC001-TC020
│   ├── recurrence.test.ts              ← Casos de teste recorrência
│   ├── checkin.test.ts                 ← Casos de teste check-in
│   └── integration.test.ts
├── .github/
│   └── workflows/
│       └── ci.yml
└── package.json
```

---

## MÉTRICAS DE SUCESSO DO MVP

### Fase 1 (Go-Live)
- Taxa de parsing válido: > 95%
- Latência check-in: < 500ms (p95)
- Disponibilidade: > 99.5%
- Boates piloto satisfeitas: 3+
- NPS Admin: > 7/10

### Fase 2 (Mês 2-3)
- MAU: 50+ boates
- Check-ins/dia: 5.000+
- Churn mensal: < 5%
- Revenue MRR: R$ 15.000+

### Fase 3 (Ano 1)
- Faturamento: R$ 100.000+ MRR
- Boates ativas: 200+
- NPS Score: > 50

---

## QUESTÕES FREQUENTES

### P: Por onde começo?
**R:** Se você é dev:
1. Ler DOCS_BUSINESS_LOGIC.md (requisitos)
2. Ler ARCHITECTURE_DIAGRAMS.md (arquitetura)
3. Copiar IMPLEMENTATION_CHECKLIST.md para GitHub Projects
4. Começar pela Fase 1 (DB + API routes)

### P: Como devo estruturar o parsing?
**R:** Seguir exatamente PARSING_ALGORITHM_SPEC.md com os 6 passos e 5 regras de validação. Temos 20 casos de teste prontos em TC001-TC020.

### P: Qual é a prioridade?
**R:** P0 (blocker):
1. Criar evento
2. Parsing de nomes
3. Check-in com validação horária

P1 (must-have):
4. Recorrência semanal
5. Formulário público
6. Relatório básico

### P: Quando lançar?
**R:** Semana 11 (após 4 semanas dev + 1 semana piloto). Não antes.

### P: Preciso de aprovação para cada feature?
**R:** Não. Siga o checklist em IMPLEMENTATION_CHECKLIST.md. Validações já estão incluídas.

---

## DEPENDÊNCIAS E BLOQUEADORES

### Não Bloqueados (Podem começar agora)
- Setup infraestrutura (Docker, DB, Redis)
- Design UI/UX (layouts em ARCHITECTURE_DIAGRAMS.md)
- API routes CRUD básicas
- Parsing algorithm (spec pronta)

### Bloqueados (Precisam de input)
- Preço final (R$ 299 vs 399?)
- Logo/branding (design)
- Integração com catraca eletrônica (parceiro)

### Em Paralelo
- Validação de mercado (entrevistas com boates)
- Prototipagem rápida (Figma clickable)
- Legal/compliance (termos de serviço)

---

## CONTACTS E PROPRIEDADE

| Role | Responsável | Documentação |
|------|-------------|--------------|
| Product Manager | - | EXECUTIVE_SUMMARY.md |
| Tech Lead | - | ARCHITECTURE_DIAGRAMS.md |
| Backend Lead | - | DOCS_BUSINESS_LOGIC.md + PARSING_ALGORITHM_SPEC.md |
| Frontend Lead | - | ARCHITECTURE_DIAGRAMS.md (layouts) |
| QA Lead | - | IMPLEMENTATION_CHECKLIST.md (casos de teste) |

---

## HISTÓRICO DE REVISÕES

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | 2025-11-23 | Spec MVP inicial (5 docs, 102KB) |
| - | - | - |

---

## PRÓXIMOS PASSOS

### Semana 1 (Validação)
- [ ] PM: Validar problema com 5 boates (entrevistas)
- [ ] Design: Criar mockups no Figma
- [ ] Tech Lead: Revisar arquitetura com time

### Semana 2 (Setup)
- [ ] Criar repositório com estrutura de pastas
- [ ] Setup CI/CD (GitHub Actions)
- [ ] Database migrado para staging
- [ ] Criar GitHub Projects com checklist

### Semana 3-6 (Desenvolvimento)
- [ ] Semana 3: Fase 1 (DB + Auth)
- [ ] Semana 4: Fase 2 (Recorrência + Parsing)
- [ ] Semana 5: Fase 3 (Check-in real-time)
- [ ] Semana 6: Testes + refinamentos

### Semana 7-8 (Piloto)
- [ ] Deploy em staging
- [ ] Onboarding 3 boates piloto
- [ ] Feedback iterativo
- [ ] Bug fixes

### Semana 9 (Go-Live)
- [ ] Deploy em produção
- [ ] Suporte 24/7 ativo
- [ ] Monitoramento (Sentry, logs)

---

## LICENÇA E PROPRIEDADE

Documento confidencial preparado para:
**Gerenciador de Listas VIP - Casa Noturna**

Todos os direitos reservados.

---

**Última atualização:** 2025-11-23
**Versão MVP:** 1.0
**Status:** Pronto para Desenvolvimento
**Aprovação necessária:** CEO + CTO
