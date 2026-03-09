# API Reference - SaaS VIP List Manager
**Versão:** 1.0
**Data:** 2025-11-23
**Status:** MVP Specification

---

## VISÃO GERAL

Total de **9 endpoints core** + WebSocket

Todas as respostas seguem padrão:
```json
{
  "success": true|false,
  "data": {},
  "error": { "code": "...", "message": "..." },
  "timestamp": "2025-11-23T00:15:42Z"
}
```

---

## ENDPOINTS CORE

### 1. ADMIN - Eventos

#### 1.1 Criar Evento (Template ou Instância)
```
POST /api/admin/eventos
Authorization: Bearer <JWT>
Content-Type: application/json

Body:
{
  "nome": "Festa Sábado",
  "descricao": "Grande festa de sábado",
  "data_referencia": "2025-11-15",
  "hora_inicio": "23:00",
  "hora_fim": "05:00",
  "hora_vip_limite": "00:30",
  "capacidade": 100,
  "tipo_cliente": "VIP",
  "boate_id": "boate-uuid-123"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "id": "evento-uuid",
    "nome": "Festa Sábado",
    "template": true,
    "created_at": "2025-11-23T00:00:00Z"
  }
}

Error (400 Bad Request):
{
  "success": false,
  "error": {
    "code": "INVALID_DATE",
    "message": "Data deve ser >= hoje"
  }
}
```

**Validações:**
- data_referencia >= hoje
- hora_fim > hora_inicio
- capacidade >= 1
- Required: nome, data, hora_inicio, hora_fim, capacidade

---

#### 1.2 Clonar Evento com Recorrência
```
POST /api/admin/eventos/:evento_id/clone
Authorization: Bearer <JWT>
Content-Type: application/json

Body:
{
  "semanas": 4,
  "manter_horarios": true,
  "manter_capacidade": true
}

Response (201 Created):
{
  "success": true,
  "data": {
    "template_id": "evento-uuid",
    "instancias_criadas": [
      {
        "id": "inst-1",
        "data_efetiva": "2025-11-22",
        "semana_numero": 1
      },
      {
        "id": "inst-2",
        "data_efetiva": "2025-11-29",
        "semana_numero": 2
      },
      {
        "id": "inst-3",
        "data_efetiva": "2025-12-06",
        "semana_numero": 3
      },
      {
        "id": "inst-4",
        "data_efetiva": "2025-12-13",
        "semana_numero": 4
      }
    ],
    "total": 4
  }
}
```

**Validações:**
- semanas: 1-52
- Todas as instâncias devem ser no futuro
- evento_id deve existir e ser template

---

#### 1.3 Listar Eventos
```
GET /api/admin/eventos?
  data_inicio=2025-11-01&
  data_fim=2025-12-31&
  tipo_cliente=VIP&
  status=Ativo&
  boate_id=abc&
  page=1&
  limit=20

Authorization: Bearer <JWT>

Response (200 OK):
{
  "success": true,
  "data": {
    "eventos": [
      {
        "id": "evento-uuid",
        "nome": "Festa 15/11",
        "data_efetiva": "2025-11-15",
        "template_id": null,
        "total_nomes": 50,
        "presentes": 35,
        "taxa_ocupacao": 70,
        "status": "Ativo"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

---

### 2. PROMOTER - Submissão de Nomes

#### 2.1 Submeter Nomes (Público - SEM AUTENTICAÇÃO)
```
POST /api/submit-names
Content-Type: application/json

Body:
{
  "evento_id": "evento-uuid",
  "raw_text": "🔥 João Silva\n1- Maria Santos\n(Carla Oliveira)\npedro ferreira"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "submission_id": "sub-123-abc",
    "evento_id": "evento-uuid",
    "names_received": 4,
    "names_valid": 4,
    "names_rejected": 0,
    "parsed_names": [
      "João Silva",
      "Maria Santos",
      "Carla Oliveira",
      "Pedro Ferreira"
    ],
    "status": "Pendente",
    "message": "4 nomes recebidos. Enviado para aprovação.",
    "expires_at": "2025-11-24T00:00:00Z"
  }
}

Error (400 Bad Request):
{
  "success": false,
  "error": {
    "code": "PARSING_ERROR",
    "message": "1 nome rejeitado",
    "details": {
      "rejected": [
        {
          "line": 1,
          "value": "@invalid",
          "error": "Caracteres inválidos"
        }
      ]
    }
  }
}
```

**Validações:**
- evento_id deve existir
- raw_text: min 1 nome, max 500
- Rate limiting: 10 req/hora por IP
- CAPTCHA se > 100 nomes

**Parsing regras:**
- Remove emojis, numeração leading
- Title Case normalização
- Deduplicação case-insensitive

---

#### 2.2 Listar Submissões Pendentes (ADMIN ONLY)
```
GET /api/admin/submissions?
  status=Pendente&
  evento_id=xyz&
  page=1&
  limit=10

Authorization: Bearer <JWT>

Response (200 OK):
{
  "success": true,
  "data": {
    "submissions": [
      {
        "id": "sub-123",
        "evento_id": "evento-uuid",
        "total_names": 4,
        "valid_names": 4,
        "status": "Pendente",
        "submitted_at": "2025-11-23T12:00:00Z",
        "expires_at": "2025-11-24T12:00:00Z",
        "submission_ip": "192.168.1.1"
      }
    ],
    "total": 5
  }
}
```

---

#### 2.3 Aprovar Submissão (ADMIN ONLY)
```
POST /api/admin/submissions/:submission_id/approve
Authorization: Bearer <JWT>
Content-Type: application/json

Body:
{
  "approved_names": ["João Silva", "Maria Santos", "Carla Oliveira"],
  "notes": "Aprovado com pendências"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "submission_id": "sub-123",
    "status": "Aprovado",
    "names_inserted": 3,
    "approved_at": "2025-11-23T12:30:00Z",
    "approved_by": "admin-user-id"
  }
}
```

---

#### 2.4 Rejeitar Submissão (ADMIN ONLY)
```
POST /api/admin/submissions/:submission_id/reject
Authorization: Bearer <JWT>
Content-Type: application/json

Body:
{
  "reason": "Qualidade baixa dos nomes",
  "notes": "Solicit resubmissão com mais cuidado"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "submission_id": "sub-123",
    "status": "Rejeitado",
    "rejected_at": "2025-11-23T12:30:00Z"
  }
}
```

---

### 3. PORTARIA - Check-in

#### 3.1 Busca Real-time
```
GET /api/portaria/search?
  q=João&
  evento_id=evento-uuid&
  limit=10

Authorization: Bearer <JWT> (Portaria role)

Response (200 OK):
{
  "success": true,
  "data": {
    "query": "João",
    "results": [
      {
        "id": "guest-uuid-1",
        "nome": "João Silva",
        "tipo_cliente": "VIP",
        "horario_limite": "00:30",
        "ja_entrada": false,
        "timestamp_entrada": null
      },
      {
        "id": "guest-uuid-2",
        "nome": "João Pedro",
        "tipo_cliente": "Convidado",
        "horario_limite": null,
        "ja_entrada": true,
        "timestamp_entrada": "2025-11-23T23:45:00Z"
      }
    ],
    "total": 2
  }
}

Response (204 No Content):
{
  "success": true,
  "data": {
    "results": [],
    "message": "Nenhum resultado encontrado"
  }
}
```

**Performance:**
- Latência esperada: < 100ms
- Busca case-insensitive
- Partial matching (João encontra João Silva)

---

#### 3.2 Fazer Check-in
```
POST /api/portaria/checkin
Authorization: Bearer <JWT> (Portaria role)
Content-Type: application/json

Body:
{
  "guest_id": "guest-uuid",
  "evento_id": "evento-uuid",
  "timestamp": 1700700000
}

Response (201 Created):
{
  "success": true,
  "data": {
    "guest_id": "guest-uuid",
    "guest_nome": "João Silva",
    "evento_id": "evento-uuid",
    "tipo_cliente": "VIP",
    "permitido": true,
    "mensagem": "Bem-vindo João Silva!",
    "cor": "green",
    "timestamp_entrada": "2025-11-23T00:15:42Z"
  }
}

Response (403 Forbidden):
{
  "success": false,
  "error": {
    "code": "TIME_RESTRICTION",
    "message": "Entrada bloqueada",
    "details": {
      "tipo_cliente": "VIP",
      "horario_limite": "00:30",
      "horario_agora": "01:00",
      "motivo": "VIP até 00:30, agora é 01:00"
    }
  },
  "data": {
    "cor": "red",
    "permitido": false
  }
}
```

**Validações:**
- VIP: horario_agora <= horario_vip_limite
- Convidado: sem restrição
- Nenhum check-in duplicado (unique guest_id + evento_id)

---

#### 3.3 Listar Check-ins do Dia
```
GET /api/portaria/relatorio?
  evento_id=evento-uuid&
  data=2025-11-23&
  tipo_cliente=VIP&
  page=1&
  limit=50

Authorization: Bearer <JWT> (Portaria or Admin)

Response (200 OK):
{
  "success": true,
  "data": {
    "evento": {
      "id": "evento-uuid",
      "nome": "Festa 23/11",
      "data": "2025-11-23",
      "capacidade": 100
    },
    "metricas": {
      "total_presentes": 87,
      "taxa_ocupacao": 87,
      "hora_pico": {
        "periodo": "23:30-00:30",
        "entradas": 35
      },
      "primeiro_checkin": "2025-11-23T22:45:00Z",
      "ultimo_checkin": "2025-11-23T04:30:00Z"
    },
    "checkins": [
      {
        "id": "checkin-uuid",
        "guest_nome": "João Silva",
        "timestamp_entrada": "2025-11-23T00:15:42Z",
        "tipo_cliente": "VIP",
        "portaria_user": "portaria-user-1"
      }
    ],
    "total": 87,
    "page": 1
  }
}
```

---

#### 3.4 Export Relatório (CSV)
```
GET /api/portaria/relatorio/export?
  evento_id=evento-uuid&
  data=2025-11-23&
  format=csv

Authorization: Bearer <JWT> (Portaria or Admin)

Response (200 OK):
Content-Type: text/csv
Content-Disposition: attachment; filename="relatorio-23-11-2025.csv"

guest_nome,timestamp_entrada,tipo_cliente,portaria_user,duracao_estimada
João Silva,2025-11-23T00:15:42Z,VIP,Portaria-1,4h 15m
Maria Santos,2025-11-23T00:20:15Z,Convidado,Portaria-1,4h 10m
...
```

---

## WEBSOCKET (Real-time Sync)

### Conectar ao WebSocket
```
ws://localhost:3000/socket.io
ou
wss://app.example.com/socket.io

Query params:
  token=<JWT>
  evento_id=<evento-uuid>
```

### Eventos Recebidos (Listen)

#### Novo Check-in
```javascript
socket.on('checkin:new', {
  guest_id: "guest-uuid",
  guest_nome: "João Silva",
  evento_id: "evento-uuid",
  timestamp: "2025-11-23T00:15:42Z",
  tipo_cliente: "VIP"
})
```

#### Saída de Convidado
```javascript
socket.on('checkin:saida', {
  guest_id: "guest-uuid",
  guest_nome: "João Silva",
  timestamp_saida: "2025-11-23T04:30:00Z"
})
```

#### Lista Atualizada (Admin)
```javascript
socket.on('submission:approved', {
  submission_id: "sub-123",
  evento_id: "evento-uuid",
  names_inserted: 4,
  total_nomes_agora: 55
})
```

### Latência Esperada
- WebSocket direto: < 500ms
- Fallback polling: 2s

---

## AUTENTICAÇÃO

Todas as rotas (exceto /submit-names) requerem JWT Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Roles:**
- `admin` - Acesso total (criar eventos, aprovar)
- `portaria` - Apenas check-in (busca, checkin, relatorio)
- `promoter` - Apenas submit (submit-names)
- `viewer` - Apenas leitura (relatorio)

---

## RATE LIMITING

| Endpoint | Limite | Janela |
|----------|--------|--------|
| POST /api/submit-names | 10 | 1 hora/IP |
| POST /api/portaria/checkin | 100 | 1 min/portaria |
| GET /api/portaria/search | Unlimited | - |
| POST /api/admin/* | Unlimited | - |

Erro (429 Too Many Requests):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Limite de requisições excedido",
    "retry_after": 3600
  }
}
```

---

## CÓDIGOS DE ERRO

| Código | Status | Significado |
|--------|--------|-------------|
| INVALID_DATE | 400 | Data inválida ou no passado |
| PARSING_ERROR | 400 | Erro no parsing de nomes |
| TIME_RESTRICTION | 403 | Fora do horário permitido |
| DUPLICATE_CHECKIN | 409 | Já fez check-in |
| NOT_FOUND | 404 | Recurso não encontrado |
| UNAUTHORIZED | 401 | Sem autenticação/token inválido |
| FORBIDDEN | 403 | Sem permissão (role) |
| RATE_LIMIT_EXCEEDED | 429 | Excedeu limite |
| INTERNAL_ERROR | 500 | Erro no servidor |

---

## EXEMPLOS COMPLETOS

### Fluxo 1: Admin Cria Evento + Clona

```bash
# 1. Criar template
curl -X POST http://localhost:3000/api/admin/eventos \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Festa Sábado",
    "data_referencia": "2025-11-15",
    "hora_inicio": "23:00",
    "hora_fim": "05:00",
    "hora_vip_limite": "00:30",
    "capacidade": 100,
    "tipo_cliente": "VIP",
    "boate_id": "boate-123"
  }'

Response: { "success": true, "data": { "id": "evt-123" } }

# 2. Clonar 4 semanas
curl -X POST http://localhost:3000/api/admin/eventos/evt-123/clone \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "semanas": 4,
    "manter_horarios": true,
    "manter_capacidade": true
  }'

Response: { "success": true, "data": { "instancias_criadas": [...] } }
```

### Fluxo 2: Promoter Submete + Admin Aprova

```bash
# 1. Promoter submete (SEM AUTH)
curl -X POST http://localhost:3000/api/submit-names \
  -H "Content-Type: application/json" \
  -d '{
    "evento_id": "evt-123",
    "raw_text": "🔥 João Silva\n1- Maria\n(Carla)"
  }'

Response: { "success": true, "data": { "submission_id": "sub-123", "names_received": 3 } }

# 2. Admin aprova
curl -X POST http://localhost:3000/api/admin/submissions/sub-123/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "approved_names": ["João Silva", "Maria", "Carla"] }'

Response: { "success": true, "data": { "names_inserted": 3 } }
```

### Fluxo 3: Portaria Check-in

```bash
# 1. Buscar
curl -X GET "http://localhost:3000/api/portaria/search?q=João&evento_id=evt-123" \
  -H "Authorization: Bearer PORTARIA_TOKEN"

Response: { "success": true, "data": { "results": [...] } }

# 2. Check-in
curl -X POST http://localhost:3000/api/portaria/checkin \
  -H "Authorization: Bearer PORTARIA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "guest_id": "guest-123",
    "evento_id": "evt-123",
    "timestamp": 1700700000
  }'

Response: { "success": true, "data": { "permitido": true, "cor": "green" } }
```

---

**Documento gerado:** 2025-11-23
**Versão:** 1.0 MVP
**Status:** Pronto para implementação
