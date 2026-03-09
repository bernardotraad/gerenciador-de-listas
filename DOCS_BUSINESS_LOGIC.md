# Especificação SaaS - Gestão de Listas VIP Casa Noturna
**Versão:** 1.0
**Data:** 2025-11-23
**Foco:** Mobile-First | Admin, Promoter, Portaria

---

## ÍNDICE
1. [Visão Geral](#visão-geral)
2. [User Stories por Persona](#user-stories-por-persona)
3. [Fluxos Críticos](#fluxos-críticos)
4. [Regras de Negócio](#regras-de-negócio)
5. [Algoritmo de Parsing de Texto](#algoritmo-de-parsing-de-texto)
6. [Modelo de Dados](#modelo-de-dados)
7. [Casos de Uso Estendidos](#casos-de-uso-estendidos)
8. [Roadmap MVP](#roadmap-mvp)

---

## VISÃO GERAL

**Objetivo:** Plataforma SaaS mobile-first para gestão de listas VIP em casas noturnas, permitindo administradores criar eventos recorrentes, promoters submeterem nomes em massa, e portaria validar/fazer check-in em tempo real.

**Premissas:**
- Hotspot público para leitura de listas (sem autenticação)
- Sincronização real-time crítica para portaria
- Validação temporal por horário de evento e tipo de cliente
- Parsing robusto de dados desestruturados

**MVP Scope:** 3 features principais (Recorrência | Parsing | Check-in)

---

## USER STORIES POR PERSONA

### ADMIN - Gestão de Eventos Recorrentes

#### US-001: Criar Evento Único
**Como** Admin
**Quero** criar um evento pontual com nome, data/hora, capacidade e tipo de cliente
**Para** gerenciar listas VIP de forma granular

**Critérios de Aceitação:**
- [ ] Campo obrigatório: Nome, Data, Hora Início, Hora Fim, Capacidade
- [ ] Campos opcionais: Descrição, Local, Código da Boate
- [ ] Default: Status = "Ativo" | Tipo Cliente = "VIP"
- [ ] Validação: Data >= hoje | Capacidade >= 1 | Hora Fim > Hora Início
- [ ] Feedback: Toast success + redirecionamento para lista do evento

**Edge Cases:**
- Evento no passado: Bloqueado com mensagem clara
- Capacidade = 0: Erro de validação
- Horário inválido (ex: 05:00 -> 04:00): Bloqueado

---

#### US-002: Clonar Evento com Recorrência Semanal
**Como** Admin
**Quero** clonar um evento-template (ex: dia 15) para múltiplas semanas (dia 22, 29...)
**Para** reutilizar configurações evitando duplicação manual

**Critérios de Aceitação:**
- [ ] Modal de clonagem com opções:
  - Quantas semanas? [1-52]
  - Manter horários? [Sim/Não]
  - Manter capacidade? [Sim/Não]
- [ ] Cada clone é INSTÂNCIA independente (lista separada)
- [ ] Template original mantém referência (relação 1:N)
- [ ] Validação: Semanas futuras apenas
- [ ] Feedback: "4 eventos clonados com sucesso" + listagem

**Edge Cases:**
- Clonar 52 semanas em calendário gregoriano: Validar fim do ano
- Evento recorrente sobre feriado: Avisar mas permitir (negócio decide)
- Template com lista já populada: Clonar vazio (nova instância)

**Modelo Conceitual:**
```
evento_template
  ├─ id: uuid
  ├─ nome: string
  ├─ data_referencia: date (ex: 2025-11-15)
  ├─ hora_inicio: time
  ├─ hora_fim: time
  ├─ capacidade: int
  └─ tipo_cliente: enum ['VIP', 'Convidado', 'Misto']

evento_instancia (N clones do template)
  ├─ id: uuid
  ├─ template_id: uuid (FK)
  ├─ semana_numero: int (ex: 1, 2, 3...)
  ├─ data_efetiva: date (auto-calculada: template.data_ref + (semana_numero * 7 dias))
  ├─ lista_vips: array de guest_records
  └─ status: enum ['Ativo', 'Cancelado']
```

---

#### US-003: Visualizar Histórico e Correlações de Eventos
**Como** Admin
**Quero** ver quais instâncias vieram do mesmo template
**Para** entender padrões de ocupação e gestão de listas

**Critérios de Aceitação:**
- [ ] Dashboard com grid: Data | Evento | Capacidade | Ocupação | Template
- [ ] Filtro: Mostrar só recorrentes | Por template | Por período
- [ ] Ação: "Ver template" leva a evento original
- [ ] Métrica: Taxa ocupação por semana

**Edge Cases:**
- Nenhum evento é recorrente: Mostrar mensagem amigável
- Clonar template deletado: Template_id orphaned (mostrar "Evento orfão")

---

### PROMOTER - Submissão em Massa com Parsing Inteligente

#### US-004: Submeter Nomes em Textarea com Parsing
**Como** Promoter
**Quero** colar 150+ nomes de forma suja (emojis, numeração, espaços extras)
**Para** popular a lista VIP rapidamente via formulário público

**Critérios de Aceitação:**
- [ ] Campo: Textarea (placeholder: "Cole os nomes aqui, um por linha")
- [ ] Aceitação: URL pública (sem autenticação)
- [ ] Limite: 500 nomes por submissão
- [ ] Parsing automático:
  - Remove: Emojis, números leading, espaços extras, caracteres especiais
  - Preserva: Nomes latinos, acentuação, hífens internos (ex: "Jean-Paul")
  - Normaliza: Title Case (ex: "joão silva" -> "João Silva")
- [ ] Duplicação: Detecta nomes idênticos (case-insensitive), avisa sem inserir
- [ ] Status: Marca como "Pendente Aprovação" (Admin revisa antes)
- [ ] Feedback:
  - Sucesso: "150 nomes recebidos. Enviado para aprovação. ID: ABC123"
  - Erro: Lista de linhas rejeitadas com motivo

**Edge Cases:**
- Paste com 800 nomes: Erro "Limite 500 nomes" + sugestão de split
- Linha vazia: Ignorada silenciosamente
- Só emojis: "🔥🔥🔥" -> Rejeitado com mensagem
- Nome com números no meio: "Ap4recida" -> Validar regra (aceitar ou rejeitar?)

---

#### US-005: Editar Lista Pendente (Draft Mode)
**Como** Promoter
**Quero** revisar, remover nomes duplicados ou adicionar antes de enviar
**Para** garantir qualidade da lista

**Critérios de Aceitação:**
- [ ] Estado transitório: "Rascunho"
- [ ] CRUD: Ver, Adicionar (um por um), Remover, Enviar
- [ ] Detecção: Automaticamente marca duplicatas
- [ ] Limite temporal: Draft expira em 24h (purge automático)
- [ ] Validação ao Enviar: Mínimo 1 nome | Máximo 500

**Edge Cases:**
- Rascunho com 0 nomes: Botão "Enviar" desabilitado
- Adicionar nome duplicado: Toast "Já existe na lista"
- Draft com 24h+: Auto-delete ou aviso para resubmeter?

---

### PORTARIA - Check-in Real-Time

#### US-006: Busca Rápida e Check-in
**Como** Portaria
**Quero** buscar nome rapidamente e fazer check-in com validação de horário
**Para** controlar fluxo de entrada VIP em tempo real

**Critérios de Aceitação:**
- [ ] Interface: Campo busca + Enter | Teclado numérico otimizado (mobile)
- [ ] Busca: Partial matching (ex: "João" encontra "João Silva", "João Pedro")
- [ ] Resultados: Mostrar nome completo + tipo de cliente + horário permitido
- [ ] Check-in: 1 clique = marca presente + timestamp
- [ ] Validação de Horário:
  - Se tipo = VIP: Só permite entrada até `horario_vip_limite` (ex: 00:30)
    - Fora desse limite: Bloqueado com mensagem "VIP permitido até [hora_vip_limite]"
    - Após `hora_fim` do evento: Bloqueado para todos (evento encerrado)
  - Se tipo = Convidado: Sem restrição de `horario_vip_limite`, mas bloqueado após `hora_fim`
  - **Resumo:** `hora_vip_limite` é exclusivo de VIP; `hora_fim` encerra o evento para todos
- [ ] Feedback Visual:
  - Entrada validada: Verde + som (opcional)
  - Entrada bloqueada: Vermelho + motivo
  - Já fez check-in: Amarelo "Já dentro"
- [ ] Sincronização: Real-time (WebSocket ou polling 2s)

**Edge Cases:**
- Buscar vácuo: "Xyz" não encontra nada -> Sugestão "Nenhum resultado"
- Dois nomes idênticos (homônimos): **Permitido entre submissões diferentes** — ex: dois "João Silva" enviados por promoters distintos são aceitos e aparecem ambos no resultado de busca, diferenciados pelo remetente (ex: "João Silva — via Pedro Promoter"). A portaria toca no correto. *Dentro da mesma submissão, duplicatas continuam sendo descartadas pelo parsing.*
- Check-in fora do horário: "VIP até 00:00, agora é 01:15"
- Lista vazia: "Nenhum VIP cadastrado ainda"
- Conexão perdida: Modo offline com aviso vermelho (usar cache)

---

#### US-007: Relatório de Check-in do Dia
**Como** Portaria/Admin
**Quero** ver quantos VIPs entraram, horário de pico, detalhes
**Para** analisar fluxo e gerar relatório

**Critérios de Aceitação:**
- [ ] Grid: Nome | Horário Entrada | Tempo na Fila | Status
- [ ] Filtros: Por evento | Por tipo cliente | Por horário
- [ ] Métricas: Total | Taxa ocupação | Hora Pico
- [ ] Export: CSV para análise
- [ ] Sincronização: Auto-refresh a cada 5s

**Edge Cases:**
- Evento sem check-ins: Mostrar "0 entradas até agora"
- Portaria faz check-in fora do horário do evento: Aviso mas permite
- Check-in com timestamp no futuro: Bloquear (validação do cliente)

---

## FLUXOS CRÍTICOS

### FLUXO 1: Criar Evento Semanal Recorrente

```
ADMIN
 |
 └─> Tela: "Novo Evento"
      ├─ Preenche: Nome, Data, Hora, Capacidade
      ├─ Salva evento_template
      └─> Tela: "Opções de Recorrência?"
          ├─ Seleciona: Clonar em 4 semanas
          ├─ Confirma: Horários, capacidade
          └─> Valida datas (futuro, sem conflito)
              └─> Cria 4x evento_instancia
                  ├─ Instancia 1: 2025-11-22
                  ├─ Instancia 2: 2025-11-29
                  ├─ Instancia 3: 2025-12-06
                  └─ Instancia 4: 2025-12-13
                      └─> Toast: "4 eventos criados"
                          └─> Redireciona para lista do evento_template
```

**Validações Críticas:**
1. Data template >= hoje
2. Cada instancia data_efetiva = template.data_ref + (semana_numero * 7 dias)
3. Nenhuma instancia no passado
4. Max 52 clones por submissão

---

### FLUXO 2: Submeter Nomes via Formulário Público

```
PROMOTER (sem autenticação)
 |
 └─> Acessa: /submit-names?evento_id=ABC123
      └─> Vê: Evento (nome, data, horário)
          └─> Cola texto sujo no Textarea:
              "
              🔥 João Silva
              1- Maria Santos
              (Carla Oliveira)
              pedro  ferreira
              "
          └─> Clica "Enviar"
              ├─ Parsing Pipeline:
              │  ├─ Linha 1: "🔥 João Silva"
              │  │   └─ Remove emoji: "João Silva"
              │  │   └─ Title Case: "João Silva" ✓
              │  ├─ Linha 2: "1- Maria Santos"
              │  │   └─ Remove numeração: "Maria Santos"
              │  │   └─ Title Case: "Maria Santos" ✓
              │  ├─ Linha 3: "(Carla Oliveira)"
              │  │   └─ Remove parênteses: "Carla Oliveira"
              │  │   └─ Title Case: "Carla Oliveira" ✓
              │  └─ Linha 4: "pedro ferreira"
              │      └─ Title Case: "Pedro Ferreira" ✓
              │
              ├─ Validação:
              │  ├─ Duplicados? NÃO
              │  ├─ Nomes válidos? 4 de 4 ✓
              │  └─ Capacidade? 4 <= 50 ✓
              │
              └─> Cria guest_submission (status: "Pendente")
                  └─> Toast: "4 nomes recebidos. Enviado para aprovação."
                      └─> Email para Admin: "Nova submissão: ID ABC-XYZ"
```

**Algoritmo Detalhado:** Veja seção 5

---

### FLUXO 3: Check-in na Portaria

```
PORTARIA (Mobile, real-time)
 |
 └─> Tela: "Check-in Evento" (data, horário atual)
      └─> Campo busca + Teclado
          └─> Digita: "João"
              ├─ Busca real-time (fetch enquanto digita)
              ├─ Resultados:
              │  - João Silva (VIP) - Até 00:30
              │  - João Pedro (Convidado) - Sem limite
              │
              └─> Clica "João Silva"
                  ├─ Validação Horária:
                  │  ├─ Tipo: VIP
                  │  ├─ Horário evento: 23:00 - 05:00
                  │  ├─ Horário limite VIP: 00:30
                  │  ├─ Horário atual: 00:15
                  │  └─ Status: ✓ DENTRO DO HORÁRIO
                  │
                  └─> Clica "CHECK-IN"
                      ├─ Insere check_in_record:
                      │  - guest_id: ABC
                      │  - evento_id: XYZ
                      │  - timestamp: 2025-11-23 00:15:42
                      │  - status: "Presente"
                      │
                      └─> Feedback Visual:
                          ├─ Tela fica VERDE
                          ├─ Som: Bip (se habilitado)
                          └─ Mensagem: "João Silva - Bem-vindo!"
                              └─> Auto-limpa em 2s, volta ao campo busca
```

**Validações Críticas:**
1. Horário atual no intervalo [hora_inicio, hora_fim]
2. Se VIP, horário <= horario_vip_limite
3. Nenhum check-in duplicado no mesmo evento
4. Real-time sync (WebSocket para múltiplas portarias)

---

### FLUXO 4: Aprovação de Submissão (Admin)

```
ADMIN
 |
 └─> Dashboard: "5 Submissões Pendentes"
      └─> Clica submissão "ABC-XYZ"
          └─> Visualiza:
              ├─ Evento: Festa 15/11
              ├─ Nomes (4): João, Maria, Carla, Pedro
              ├─ Parsing Status: 4 válidos, 0 rejeitados
              ├─ Submitter: IP, Timestamp
              │
              └─> Ações:
                  ├─ "Aprovar" (bulk add à lista)
                  │   └─> Move status: "Pendente" -> "Aprovado"
                  │   └─> Insere 4 guest_records
                  │   └─> Toast: "4 nomes adicionados à lista"
                  │
                  ├─ "Rejeitar" (com motivo)
                  │   └─> Marca "Rejeitado"
                  │   └─> Email para Promoter (opcional)
                  │
                  └─ "Editar" (remover alguns nomes)
                      └─> Draft mode
                      └─> Pode remover Maria, aprovar 3
```

---

## REGRAS DE NEGÓCIO

### RN-001: Modelo Template vs Instância
- **Template** = Evento base com data de referência (ex: sempre 15/mês)
- **Instância** = Clone concreto em data específica (ex: 15/11, 22/11, 29/11)
- Cada instância tem lista de VIPs independente
- Deletar template NÃO deleta instâncias (orphaning permitido)
- Modificar template NÃO afeta instâncias já criadas

### RN-002: Horários VIP Rígidos
- **VIP** pode entrar até `horario_vip_limite` (ex: 00:30)
- **Convidado** sem restrição temporal
- Validação no cliente (portaria) + servidor
- Timezone: Sempre UTC-3 (Brasil) ou configurável por boate

### RN-003: Parsing de Texto - 3 Regras Essenciais
1. **Normalização:** Remover emojis, números leading, símbolos especiais (manter: acentos, hífens internos)
2. **Capitalization:** Title Case (primeira letra maiúscula)
3. **Deduplicação:** Case-insensitive (João = joão = JOÃO são iguais)

### RN-004: Validação de Nome
- **Mínimo:** 2 caracteres
- **Máximo:** 100 caracteres
- **Padrão regex:** `^[a-zA-ZÀ-ÿ\s\-']+$` (letras, espaços, hífens, apóstrofos)
- **Regra de dígitos:** Qualquer dígito (0-9) em qualquer posição do nome = inválido
  - Inclui: no início (`"123João"`), no meio (`"Ap4recida"`), no final (`"João2"`)
  - Razão: O parsing remove numeração *leading* (ex: `"1- João"`); dígitos que sobrevivem são dados corrompidos
- **Exemplos válidos:** `"João Silva"`, `"Jean-Paul O'Brien"`, `"José de Oliveira"`, `"María"`, `"Müller"`
- **Exemplos inválidos:** `"123João"`, `"Ap4recida"`, `"@Maria"`, `"João🔥"`, `"X"` (muito curto)

### RN-005: Sincronização Real-Time (Portaria)
- **Prioridade:** Latência < 1s
- **Tecnologia:** WebSocket + fallback polling (2s)
- **Eventos sincronizados:** Check-in, remoção de nome, atualização de status
- **Cache local:** Manter lista da portaria em memory (refresh a cada evento)
- **Modo offline:** Se conexão perdida, usar cache + marcar transações como "sync pending"

### RN-006: Limite de Capacidade
- Boate define capacidade máxima por evento
- **Comportamento ao atingir o limite: Soft Warning** — a portaria recebe aviso visual em destaque (badge vermelho "100/100 — Capacidade atingida"), mas o check-in **não é bloqueado automaticamente**
- Rationale: a casa noturna tem autoridade para decidir se aceita mais pessoas (ex: saídas compensando entradas); o sistema não bloqueia uma decisão que é do negócio
- O Admin pode monitorar a taxa de ocupação em tempo real pelo dashboard
- Métrica: `taxa_ocupacao = (check_ins / capacidade) * 100`

### RN-007: Expiração de Dados
- **Guest Submission (pendente):** Expira em 24h
- **Check-in records:** Mantém por 90 dias (análise histórica)
- **Eventos passados:** Arquivados automaticamente após 30 dias
- **Sessão Portaria:** 8 horas (logout automático)

### RN-008: Duplicação de Nomes — Regras por Escopo

**Dentro da mesma submissão (mesmo promoter):**
- O parsing detecta duplicatas case-insensitive e descarta a ocorrência extra
- Razão: é erro do promoter ter repetido o nome na lista
- Feedback: `errors[]` lista os descartados

**Entre submissões diferentes (promoters distintos):**
- Dois "João Silva" enviados por promoters diferentes são **permitidos** — podem ser pessoas reais distintas
- Ambos os registros são criados em `guest_records` com `submission_id` diferente
- A UNIQUE constraint em `guest_records` é `UNIQUE(evento_instancia_id, LOWER(nome), submission_id)` para permitir o mesmo nome apenas uma vez por submissão
- Na UI da portaria, os dois aparecem no resultado de busca com o remetente como diferenciador (via campo `submitter_label` em `guest_submissions`)

**Admin adiciona manualmente:**
- Se o nome já existe (de qualquer source), exibir aviso "Nome já cadastrado" mas permitir prosseguir
- O `source = 'Manual'` e `submission_id = NULL` diferencia da entrada via submissão

### RN-009: Segurança de Formulário Público
- **Rate limiting:** Max 10 submissões por IP em 1 hora (defesa primária)
- **Spam protection:** Cloudflare Turnstile invisível (Fase 2) — analisa comportamento em segundo plano, desafia apenas atividade suspeita, sem atrito para promoters legítimos
- **Validação:** Server-side obrigatória (não confiar no cliente)
- **Sanitization:** Remover scripts, SQL injection (use prepared statements)

### RN-010: Eventos que Cruzam Meia-Noite
- Eventos noturnos típicos têm `data_efetiva = D` mas funcionam de D 23:00 até D+1 05:00
- O campo `data_efetiva` representa o **dia de início do evento** (antes da meia-noite)
- **Lógica para determinar qual evento está ativo agora:**
  - Buscar instâncias onde `data_efetiva = CURRENT_DATE` (evento iniciou hoje)
  - OU `data_efetiva = CURRENT_DATE - 1` E `hora_fim < hora_inicio` (evento de ontem que ainda não terminou)
  - Condição simplificada: `hora_fim < hora_inicio` indica evento que cruza meia-noite
- **Validação de horário VIP em eventos notrunos:**
  - Se `hora_vip_limite < hora_inicio` → o limite VIP é no dia seguinte (ex: 00:30 do D+1)
  - Comparar sempre usando timestamp completo (data + hora), não apenas hora
- **Recomendação de implementação:** Salvar `datetime_inicio` e `datetime_fim` absolutos no momento da criação da instância para evitar recalcular cruzamento de meia-noite a cada request

### RN-011: Distribuição do Link Público para Promoters
- O Admin gera o link público do evento no formato: `https://[dominio]/submit?evento_id=[uuid]`
- Esse link é exibido no dashboard do Admin e pode ser **copiado com 1 clique**
- O Admin distribui o link manualmente (WhatsApp, e-mail, etc.) para seus promoters — o sistema não envia automaticamente
- O link não expira (válido enquanto o evento/instância estiver com status `Ativo`)
- **Bootstrap (primeiro acesso):**
  - O primeiro Admin é criado via convite gerado internamente (painel de superadmin ou CLI)
  - O Admin cria a `boate` no primeiro login (wizard de onboarding obrigatório)
  - Sem `boate` ativa, o Admin não consegue criar eventos

---

## ALGORITMO DE PARSING DE TEXTO

### Pipeline de Limpeza

```
INPUT: "🔥 1- João   Silva (VIP)"

PASSO 1: Remover emojis
└─> "  1- João   Silva (VIP)"

PASSO 2: Remover números leading (0-9 seguido de -)
└─> "  João   Silva (VIP)"

PASSO 3: Remover símbolos especiais (manter: acentos, hífens, apóstrofos)
└─> "João Silva"

PASSO 4: Trim espaços (leading/trailing)
└─> "João Silva"

PASSO 5: Normalizar espaços múltiplos
└─> "João Silva"

PASSO 6: Title Case (cada palavra primeira letra maiúscula)
└─> "João Silva"

OUTPUT: "João Silva" ✓
```

### Pseudo-código

```javascript
function parseNames(rawText) {
  const lines = rawText
    .split('\n')
    .map(line => cleanLine(line))
    .filter(line => line.length > 0);

  return lines.map(line => validateName(line));
}

function cleanLine(line) {
  // 1. Remove emojis (regex: [\p{Emoji}])
  let cleaned = line.replace(/[\p{Emoji}]/gu, '');

  // 2. Remove números leading (ex: "1- ", "123: ")
  cleaned = cleaned.replace(/^\s*[\d\s\-\.\:\,]+/, '');

  // 3. Remove símbolos especiais, manter acentos e hífens
  cleaned = cleaned.replace(/[^\w\s\-'àáâãäèéêëìíîïòóôõöùúûüñ]/gi, '');

  // 4. Trim espaços
  cleaned = cleaned.trim();

  // 5. Normalizar espaços múltiplos
  cleaned = cleaned.replace(/\s+/g, ' ');

  // 6. Title Case
  cleaned = cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return cleaned;
}

function validateName(name) {
  // Validações
  if (name.length < 2) return { valid: false, error: "Mínimo 2 caracteres" };
  if (name.length > 100) return { valid: false, error: "Máximo 100 caracteres" };
  if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(name)) return { valid: false, error: "Caracteres inválidos" };

  return { valid: true, value: name };
}

function detectDuplicates(names) {
  const normalized = names.map(n => n.toLowerCase().trim());
  const unique = new Set(normalized);

  if (unique.size < names.length) {
    const duplicates = names.filter((n, i) => normalized.indexOf(n.toLowerCase()) !== i);
    return { hasDuplicates: true, duplicates };
  }

  return { hasDuplicates: false, duplicates: [] };
}
```

### Exemplos de Parsing

| Input | Expected Output | Status |
|-------|-----------------|--------|
| `🔥 João Silva` | `João Silva` | ✓ |
| `1- Maria Santos` | `Maria Santos` | ✓ |
| `(Carla) Oliveira` | `Carla Oliveira` | ✓ |
| `pedro ferreira` | `Pedro Ferreira` | ✓ |
| `Jean-Paul O'Brien` | `Jean-Paul O'Brien` | ✓ |
| `123João` | REJEITAR | Números no início |
| `@Maria#` | REJEITAR | Símbolos especiais |
| `🔥🔥🔥` | REJEITAR | Só emojis |
| `X` | REJEITAR | Muito curto (< 2) |
| `` (vazio) | IGNORAR | Linha em branco |

---

## MODELO DE DADOS

### Tabelas Core

#### 1. `eventos_template`
Evento base para recorrências

```
evento_template {
  id: UUID (PRIMARY KEY)
  nome: VARCHAR(255) NOT NULL
  descricao: TEXT NULLABLE
  data_referencia: DATE NOT NULL (ex: 2025-11-15)
  hora_inicio: TIME NOT NULL
  hora_fim: TIME NOT NULL
  hora_vip_limite: TIME NOT NULL (ex: 00:30)
  capacidade: INT NOT NULL
  tipo_cliente: ENUM ['VIP', 'Convidado', 'Misto'] DEFAULT 'VIP'
  boate_id: UUID (FK -> boates)
  admin_id: UUID (FK -> users)
  status: ENUM ['Ativo', 'Cancelado'] DEFAULT 'Ativo'
  created_at: TIMESTAMP DEFAULT now()
  updated_at: TIMESTAMP DEFAULT now()

  UNIQUE(boate_id, data_referencia, hora_inicio)
}
```

#### 2. `eventos_instancia`
Clone concreto de um template para data específica

```
eventos_instancia {
  id: UUID (PRIMARY KEY)
  template_id: UUID (FK -> eventos_template) NULLABLE
  nome: VARCHAR(255) NOT NULL
  data_efetiva: DATE NOT NULL
  hora_inicio: TIME NOT NULL
  hora_fim: TIME NOT NULL
  hora_vip_limite: TIME NOT NULL
  capacidade: INT NOT NULL
  tipo_cliente: ENUM ['VIP', 'Convidado', 'Misto']
  boate_id: UUID (FK -> boates)
  status: ENUM ['Ativo', 'Cancelado', 'Finalizado'] DEFAULT 'Ativo'
  semana_numero: INT NULLABLE (ex: 1, 2, 3... para rastreamento)
  created_at: TIMESTAMP DEFAULT now()
  updated_at: TIMESTAMP DEFAULT now()

  UNIQUE(boate_id, data_efetiva, hora_inicio)
  INDEX(template_id)
  INDEX(data_efetiva)
}
```

#### 3. `guest_records`
Lista de convidados por evento

```
guest_records {
  id: UUID (PRIMARY KEY)
  evento_instancia_id: UUID (FK -> eventos_instancia) NOT NULL
  nome: VARCHAR(255) NOT NULL
  tipo_cliente: ENUM ['VIP', 'Convidado'] DEFAULT 'VIP'
  source: ENUM ['Manual', 'Import', 'Submission'] DEFAULT 'Manual'
  submission_id: UUID (FK -> guest_submissions) NULLABLE  -- NULL se adicionado manualmente
  status: ENUM ['Pendente', 'Aprovado', 'Rejeitado', 'Presente'] DEFAULT 'Aprovado'
  created_at: TIMESTAMP DEFAULT now()
  added_by: UUID (FK -> users) NULLABLE

  -- Permite o mesmo nome em submissões diferentes (homônimos reais entre promoters)
  -- Previne duplicata do mesmo nome dentro da mesma submissão
  UNIQUE(evento_instancia_id, LOWER(nome), submission_id)
  INDEX(evento_instancia_id)
  INDEX(status)
  INDEX(LOWER(nome)) -- busca rápida por nome na portaria
}
```

#### 4. `guest_submissions`
Submissões em lote via formulário público

```
guest_submissions {
  id: UUID (PRIMARY KEY)
  evento_instancia_id: UUID (FK -> eventos_instancia) NOT NULL
  raw_text: TEXT NOT NULL (original bruto)
  parsed_names: JSONB (array de nomes limpos)
  submission_ip: INET NULLABLE
  status: ENUM ['Rascunho', 'Pendente', 'Aprovado', 'Rejeitado'] DEFAULT 'Pendente'
  approval_notes: TEXT NULLABLE
  approved_by: UUID (FK -> users) NULLABLE
  approved_at: TIMESTAMP NULLABLE
  expires_at: TIMESTAMP (auto-set: created_at + 24h)
  created_at: TIMESTAMP DEFAULT now()

  INDEX(evento_instancia_id)
  INDEX(status)
  INDEX(expires_at)
}
```

#### 5. `check_in_records`
Registro de entrada na portaria

```
check_in_records {
  id: UUID (PRIMARY KEY)
  guest_id: UUID (FK -> guest_records) NOT NULL
  evento_instancia_id: UUID (FK -> eventos_instancia) NOT NULL
  timestamp_entrada: TIMESTAMP DEFAULT now()
  horario_evento_inicio: TIME NOT NULL (snapshot)
  horario_evento_fim: TIME NOT NULL (snapshot)
  horario_vip_limite: TIME NOT NULL (snapshot)
  tipo_cliente: ENUM ['VIP', 'Convidado'] (snapshot)
  portaria_user_id: UUID (FK -> users) (quem fez check-in)
  status: ENUM ['Presente', 'Saída'] DEFAULT 'Presente'
  created_at: TIMESTAMP DEFAULT now()

  UNIQUE(guest_id, evento_instancia_id) (um check-in por convidado por evento)
  INDEX(evento_instancia_id)
  INDEX(timestamp_entrada)
}
```

#### 6. `boates` (Master Data)
Configuração por estabelecimento

```
boates {
  id: UUID (PRIMARY KEY)
  nome: VARCHAR(255) NOT NULL
  timezone: VARCHAR(50) DEFAULT 'America/Sao_Paulo'
  capacidade_padrao: INT DEFAULT 100
  admin_id: UUID (FK -> users)
  ativo: BOOLEAN DEFAULT true
  created_at: TIMESTAMP DEFAULT now()
}
```

#### 7. `users` (Simplified)
Usuários do sistema

```
users {
  id: UUID (PRIMARY KEY)
  email: VARCHAR(255) NOT NULL UNIQUE
  nome: VARCHAR(255) NOT NULL
  role: ENUM ['Admin', 'Promoter', 'Portaria', 'Viewer'] DEFAULT 'Viewer'
  boate_id: UUID (FK -> boates)
  status: ENUM ['Ativo', 'Inativo']
  created_at: TIMESTAMP DEFAULT now()

  INDEX(boate_id, role)
}
```

### Relações ERD Simplificado

```
boates
  ├─ 1:N eventos_template
  ├─ 1:N eventos_instancia
  └─ 1:N users

eventos_template
  └─ 1:N eventos_instancia

eventos_instancia
  ├─ 1:N guest_records
  ├─ 1:N guest_submissions
  └─ 1:N check_in_records

guest_records
  ├─ 1:N check_in_records
  └─ M:1 guest_submissions

guest_submissions
  └─ M:1 users (approved_by)

users
  ├─ 1:N eventos_template (admin_id)
  └─ 1:N check_in_records (portaria_user_id)
```

---

## CASOS DE USO ESTENDIDOS

### UC-1: Busca Avançada de Eventos (Admin)
**Contexto:** Admin quer filtrar eventos por:
- Data range (ex: 15/11 a 30/11)
- Tipo cliente (VIP, Convidado, Misto)
- Status (Ativo, Cancelado, Finalizado)
- Boate específica
- Recorrentes vs pontuais

**Implementação:**
```sql
SELECT
  e.id, e.nome, e.data_efetiva,
  COALESCE(t.id, NULL) as template_id,
  COUNT(g.id) as total_nomes,
  COUNT(CASE WHEN c.status = 'Presente' THEN 1 END) as presentes,
  (COUNT(CASE WHEN c.status = 'Presente' THEN 1 END)::float / e.capacidade * 100)::int as taxa_ocupacao
FROM eventos_instancia e
LEFT JOIN eventos_template t ON e.template_id = t.id
LEFT JOIN guest_records g ON e.id = g.evento_instancia_id
LEFT JOIN check_in_records c ON g.id = c.guest_id
WHERE e.data_efetiva BETWEEN ? AND ?
  AND e.boate_id = ?
GROUP BY e.id, t.id
ORDER BY e.data_efetiva DESC
```

---

### UC-2: Webhook para Sistemas de Entrada
**Contexto:** Casa noturna integra com catraca eletrônica

**Endpoint:** `POST /api/portaria/checkin`
```json
{
  "evento_instancia_id": "uuid",
  "guest_nome": "João Silva",
  "action": "check-in|saída",
  "timestamp_unix": 1700700000
}
```

**Response:**
```json
{
  "status": "success|error",
  "guest_id": "uuid",
  "tipo_cliente": "VIP|Convidado",
  "permitido": true|false,
  "mensagem": "Bem-vindo!" | "VIP até 00:30, agora é 01:15"
}
```

---

### UC-3: Análise de Ocupação com Gráficos
**Dashboard Métrica:**
- Gráfico linha: Ocupação por semana (comparar instâncias do template)
- Gráfico pizza: Distribuição VIP vs Convidado
- Gráfico coluna: Hora de pico (check-ins por intervalo de 30 min)

---

### UC-4: Duplicação de Nomes entre Eventos
**Regra:** Um mesmo nome não pode estar em 2 eventos no mesmo dia

**Validação:**
```sql
SELECT COUNT(*) FROM guest_records g1
JOIN guest_records g2 ON LOWER(g1.nome) = LOWER(g2.nome)
JOIN eventos_instancia e1 ON g1.evento_instancia_id = e1.id
JOIN eventos_instancia e2 ON g2.evento_instancia_id = e2.id
WHERE e1.data_efetiva = e2.data_efetiva
  AND e1.boate_id = e2.boate_id
  AND g1.id != g2.id
```

---

### UC-5: Exportação de Lista para Portaria (Offline)
**Contexto:** Portaria offline (sem internet)

**Formato:** QR Code com lista em base64 ou arquivo JSON
```json
{
  "evento_id": "uuid",
  "data": "2025-11-23",
  "nomes": [
    { "id": "uuid", "nome": "João Silva", "tipo": "VIP" },
    { "id": "uuid", "nome": "Maria Santos", "tipo": "Convidado" }
  ]
}
```

---

## ROADMAP MVP

### Fase 1: Core Features (Semanas 1-3)
> ⚠️ **Status:** Itens abaixo ainda não implementados. Código anterior foi descartado; desenvolvimento recomeça do zero seguindo esta especificação.
- [ ] Autenticação básica (Admin, Portaria)
- [ ] CRUD Eventos (criar, editar, deletar)
- [ ] Parsing de nomes + validação
- [ ] Formulário público de submissão
- [ ] Aprovação manual de submissões (Admin)
- [ ] Interface Check-in (busca + click)
- [ ] Real-time sync via WebSocket

### Fase 2: Refinamentos (Semanas 4-5)
- [ ] Rate limiting + CAPTCHA
- [ ] Exportação CSV
- [ ] Dashboard de métricas (ocupação, pico)
- [ ] Offline mode com cache
- [ ] Notificações (email, push)

### Fase 3: Premium (Semanas 6+)
- [ ] Integração com catracas eletrônicas
- [ ] Template recorrências avançadas (a cada 2 semanas, mensal)
- [ ] Análise preditiva de ocupação
- [ ] Multi-boate (gerenciador central)
- [ ] Mobile app nativa (React Native)

---

## ANEXOS

### A. Validação de Horários

**Caso 1: Check-in VIP no horário permitido**
```
Evento: 23:00 - 05:00
VIP Limite: 00:30
Horário atual: 23:45
Status: ✓ PERMITIDO
```

**Caso 2: Check-in VIP fora do horário**
```
Evento: 23:00 - 05:00
VIP Limite: 00:30
Horário atual: 01:15
Status: ✗ BLOQUEADO (VIP até 00:30)
```

**Caso 3: Convidado, hora qualquer**
```
Tipo: Convidado
Horário atual: 04:00
Status: ✓ PERMITIDO (sem limite)
```

---

### B. Rate Limiting (Proteção Spam)

| Endpoint | Limite | Janela | Critério |
|----------|--------|--------|----------|
| `/api/submit-names` | 10 req | 1 hora | Por IP (endpoint público, sem auth) |
| `/api/portaria/checkin` | 100 req | 1 min | Por usuário autenticado (JWT `user_id`) |
| `/api/admin/approval` | Sem limite | - | Somente Admin autenticado |

---

### C. Estrutura de Resposta API Padrão

```json
{
  "success": true|false,
  "data": {},
  "error": {
    "code": "VALIDATION_ERROR|AUTH_ERROR|...",
    "message": "Descrição do erro em português",
    "details": {}
  },
  "timestamp": "2025-11-23T00:15:42Z"
}
```

---

**Documento gerado:** 2025-11-23
**Revisão:** 1.0 - MVP Specification
