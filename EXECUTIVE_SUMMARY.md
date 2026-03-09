# Executive Summary - SaaS VIP List Manager
**Data:** 2025-11-23
**Versão:** 1.0
**Público-Alvo:** Stakeholders, Product Managers, Tech Leads

---

## VISÃO DO PRODUTO

### O Problema
Casas noturnas enfrentam desafios na gestão de listas VIP:
- Criar eventos semanais recorrentes é manual e propenso a erros
- Promoters submetem nomes em formatos desordenados (emojis, números, espaços)
- Portarias gastam tempo buscando nomes em listas desestruturadas
- Falta sincronização real-time entre equipes
- Sem visibilidade de ocupação e fluxo de entrada

### A Solução
Plataforma SaaS mobile-first que automatiza:
1. **Recorrência de Eventos:** Admin clona eventos template em N semanas com um clique
2. **Parsing Inteligente:** Textarea aceita 150+ nomes sujos, limpa automaticamente
3. **Check-in Real-time:** Portaria busca e valida VIP em < 1s, sincronizado entre múltiplos dispositivos

### Diferenciais
- **Mobile-First:** Interface otimizada para smartphones (campo busca, teclado numérico)
- **Real-time:** WebSocket para sincronização entre portarias
- **Validação Temporal:** VIPs só entram até hora limite (ex: 00:30)
- **Público:** Promoters submetem sem autenticação (gera mais leads)
- **Simples:** 3 features core, sem over-engineering

---

## MODELO DE NEGÓCIO

### Receita
- **SaaS Mensal:** R$ 299 - 999/mês por boate (tiered)
  - Starter: 1 boate, 500 eventos/mês
  - Professional: 1 boate, ilimitado
  - Enterprise: Multi-boate, API custom

### Usuários
- **Admin:** Gerenciador de eventos e aprovação
- **Promoter:** Submete listas (sem acesso à plataforma, formulário público)
- **Portaria:** Check-in mobile (tempo real)
- **Viewer:** Relatórios (opcional)

### Custo de Aquisição
- Direct: Vendedor conversa com boates
- Inbound: SEO "sistema gestão lista VIP"
- Parcerias: Fornecedores de som/iluminação

---

## ROADMAP DE 3 FASES

### MVP (4 semanas) - Core Features
**Objetivo:** Colocar no ar as 3 funcionalidades principais

Semana 1-2: Recorrência
- [ ] Criar evento único (template)
- [ ] Clonar em N semanas (instâncias)
- [ ] Dashboard do Admin
- [ ] Validações de data/hora

Semana 2: Parsing + Submissão Pública
- [ ] Textarea com parsing automático
- [ ] Detecção de emojis/numeração
- [ ] Rate limiting (spam protection)
- [ ] Aprovação manual do Admin

Semana 3: Check-in Real-time
- [ ] Busca rápida (real-time)
- [ ] Validação de horário VIP
- [ ] WebSocket para sincronização
- [ ] Feedback visual (verde/vermelho)
- [ ] Testes de carga

**Resultado:** Plataforma funcional para 3-5 boates piloto

### Fase 2 (2-3 semanas) - Refinamentos
- [ ] Dashboard com gráficos (ocupação, picos)
- [ ] Exportação CSV
- [ ] Modo offline para portaria
- [ ] Notificações (SMS/Email)
- [ ] Integração com catraca eletrônica
- [ ] Multi-idioma (PT/EN/ES)

### Fase 3 (4+ semanas) - Premium
- [ ] Recorrências avançadas (semanal, quinzenal, mensal)
- [ ] Análise preditiva de ocupação
- [ ] Integração com sistemas de bilheteria
- [ ] App nativa (React Native/Flutter)
- [ ] White-label para grupos de boates
- [ ] Analytics avançado

---

## MÉTRICAS DE SUCESSO

### Fase 1 (MVP)
- **Taxa de Parsing:** > 95% (menos de 5% rejeições)
- **Latência Check-in:** < 500ms (p95)
- **Disponibilidade:** > 99.5%
- **Taxa de Adoção:** 3+ boates piloto
- **NPS Admin:** > 7/10

### Fase 2
- **MAU (Monthly Active Users):** 50+ boates
- **Check-ins/dia:** 5.000+
- **Churn mensal:** < 5%
- **Revenue MRR:** R$ 15.000+

### Fase 3
- **Faturamento:** R$ 100.000+ MRR
- **Boates ativas:** 200+
- **Score NPS:** > 50

---

## ANÁLISE DE RISCO

### Risco: Taxa de Rejeição de Parsing Alta (> 10%)
**Mitigação:**
- Testes extensivos com dados reais de promoters
- Regex refinado (acentos, hífens, apóstrofos)
- UX clara: Mostrar rejeições com motivo
- A/B test de regras de parsing

### Risco: Sincronização Real-time Falha
**Mitigação:**
- Fallback: Polling a cada 2s se WebSocket cair
- Cache local em portaria (modo offline)
- Retry automático com backoff
- Sentry para monitoramento de erros

### Risco: Adoção Lenta por Boates
**Mitigação:**
- Free trial 30 dias (sem cartão)
- Onboarding simplificado (video 2 min)
- Suporte dedicado para primeiras 3 boates
- Roadmap público (transparência)

### Risco: Concorrência de Players Globais
**Mitigação:**
- Foco em experiência mobile (diferencial)
- Preço agressivo (R$ 299 vs concorrentes R$ 500+)
- Proximidade com boates (suporte 24/7 PT-BR)
- Recorrência: Feature única (competitors não têm)

---

## FINANCEIRO (Projeção 12 Meses)

### Custos Iniciais
```
Desenvolvimento: R$ 80.000 (1 dev full-time, 4 meses)
Infrastructure: R$ 3.000/mês (AWS, Redis, DB)
Marketing: R$ 5.000/mês (primeiro trim)
Total inicial: ~R$ 95.000
```

### Receita Projetada
```
Mês 1-2: R$ 0 (MVP, piloto)
Mês 3-4: R$ 3.000 (3 boates x R$ 1.000)
Mês 5-6: R$ 9.000 (9 boates)
Mês 7-8: R$ 18.000 (18 boates)
Mês 9-12: R$ 30.000-40.000 (30+ boates)

Ano 1: ~R$ 80.000 ARR
```

### Break-even
**Mês 8-9** (com 15+ boates pagando média R$ 500/mês)

---

## PLANO DE LANÇAMENTO

### Semana 1-2: Preparação
- [ ] Finalizar design no Figma
- [ ] Setup infraestrutura (AWS/Vercel, DB, Redis)
- [ ] Criar board de desenvolvimento (GitHub Projects)
- [ ] Recrutamento de 1 dev + 1 QA (freelance)

### Semana 3-8: Desenvolvimento
- [ ] Sprint 1-2: Features core (recorrência, parsing, check-in)
- [ ] Sprint 3: Testes + refinamentos
- [ ] Sprint 4: Deploy para staging + testes E2E

### Semana 9-10: Piloto
- [ ] Contato com 3 boates locais (Curitiba/SP/Rio)
- [ ] Onboarding e feedback iterativo
- [ ] Bug fixes baseado em feedback

### Semana 11: Go-Live
- [ ] Deploy em produção
- [ ] Comunicado para primeiras boates
- [ ] Suporte 24/7 ativo
- [ ] Monitoramento de erros (Sentry)

---

## DECISÕES CRÍTICAS TOMADAS

### 1. Mobile-First, não Mobile-Only
**Reasoning:** Admin usa desktop para criar eventos; portaria usa mobile. Ambas necessárias.

### 2. Template vs Instância Separados
**Reasoning:** Facilita edição independente de clones (ex: cancelar instância específica)

### 3. Parsing Server-side (não confiança em client)
**Reasoning:** Segurança + garantia de qualidade consistente

### 4. Horário Rígido para VIP
**Reasoning:** Boate controla entrada (negócio core); sem soft limits

### 5. WebSocket + Fallback Polling
**Reasoning:** Sincronização crítica, mas WebSocket pode falhar (rede mobile instável)

### 6. Submissão Pública (sem autenticação)
**Reasoning:** Promoters relutam em criar conta; maior conversão com link direto

---

## PRÓXIMOS PASSOS

### Validação de Mercado (Semana 1)
- [ ] Entrevista com 5+ boates (problema, price sensitivity, features must-have)
- [ ] Pesquisa de concorrência (Martech, Eventbrite, sistemas custom)
- [ ] Benchmark de UX em concorrentes

### Prototipação Rápida (Semana 2)
- [ ] Figma: 3 telas principais (Admin, Portaria, Submissão)
- [ ] Clickable prototype (Figma/Framer)
- [ ] Teste com 2 boates (feedback visual + fluxo)

### Desenvolvimento (Semana 3-10)
- [ ] Implementar MVP conforme checklist em `IMPLEMENTATION_CHECKLIST.md`
- [ ] Sprints semanais com demo ao stakeholder

---

## PERGUNTAS ABERTAS

1. **Pricing:** R$ 299/299/999 monthly é competitivo?
2. **Geografía:** Focar SP/Curitiba primeiro ou nacional?
3. **Extensões:** White-label para franquias de boates?
4. **Integrações:** Catraca eletrônica ou apenas mobile check-in?

---

## CONTATOS SUGERIDOS (Piloto)

- Boate Leblon (Rio) - Contato: João
- Noise Nightclub (SP) - Contato: Marina
- Garage Club (Curitiba) - Contato: Pedro

---

**Documento preparado por:** Business Analysis Team
**Data:** 2025-11-23
**Status:** Pronto para aprovação de desenvolvimento
