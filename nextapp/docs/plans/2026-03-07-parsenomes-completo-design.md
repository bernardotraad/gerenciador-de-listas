# Design: parseNomes() Completo com Pipeline de Limpeza e Preview em Tempo Real

**Data:** 2026-03-07
**Status:** Aprovado
**Arquivos afetados:** 3

---

## Problema

A implementação atual de `parseNomes()` é trivial: apenas divide por linha, faz trim e deduplica. Não remove emojis, numeração de lista, caracteres especiais, nem aplica title case. O formulário público também não dá feedback sobre nomes rejeitados.

## Decisão

**Opção A — Substituir `parseNomes()` com API rica.** A função mantém o mesmo nome mas muda o tipo de retorno para incluir nomes válidos e erros. Todos os callers são atualizados.

Descartadas:
- **Opção B** (duas funções paralelas): causaria inconsistência entre preview e server
- **Opção C** (hook client-side separado): duplicação de lógica

---

## Design

### Nova assinatura

```typescript
parseNomes(raw: string): {
    names: string[]
    errors: Array<{ value: string; error: string }>
}
```

### Pipeline de 6 passos (por linha)

1. Split por `\r?\n`
2. Remove emojis — `[\p{Emoji}\p{Emoji_Component}]` (Unicode flag)
3. Remove numeração leading — `^\s*[\d\s\-\.\:\,]+`
4. Remove caracteres especiais — mantém letras latinas, acentos, espaço, hífen, apóstrofo
5. Normaliza espaços — trim + colapsa múltiplos
6. Title Case — primeira letra maiúscula por palavra

### Validações pós-limpeza

| Regra | Condição | Erro |
|---|---|---|
| Comprimento mínimo | `< 2 chars` | "Mínimo 2 caracteres" |
| Comprimento máximo | `> 100 chars` | "Máximo 100 caracteres" |
| Padrão válido | `/^[a-zA-ZÀ-ÿ\s\-']+$/` falha | "Caracteres inválidos" |
| Sem dígitos | `/\d/` presente | "Números não permitidos" |
| Deduplicação | Já visto (case-insensitive, intra-submissão) | "Duplicado" |

Linhas vazias são silenciosamente ignoradas (não contam como erro).

### Preview no formulário

- Exibe nomes válidos como contagem: `✓ 3 nomes válidos`
- Exibe rejeitados com motivo: `✗ "🔥🔥🔥" — Emojis não permitidos`
- Transformações (ex: emoji removido, title case) mostram só o resultado limpo, sem indicar a mudança
- Botão habilitado apenas quando `names.length > 0`

---

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/lib/schemas/submissoes.ts` | Substitui `parseNomes()` pela implementação completa |
| `src/components/submissoes/submit-form.tsx` | Usa `result.names` e `result.errors` para preview |
| `src/lib/actions/submissoes.ts` | Troca `nomes` por `result.names` (1 linha) |

---

## Casos de teste relevantes (da spec)

| Input | Output |
|---|---|
| `"🔥 João Silva"` | `"João Silva"` (válido) |
| `"1- Maria Santos"` | `"Maria Santos"` (válido) |
| `"pedro ferreira"` | `"Pedro Ferreira"` (válido) |
| `"Jean-Paul O'Brien"` | `"Jean-Paul O'Brien"` (válido) |
| `"🔥🔥🔥"` | rejeitado — "Mínimo 2 caracteres" |
| `"123João"` | rejeitado — "Números não permitidos" |
| `"X"` | rejeitado — "Mínimo 2 caracteres" |
| `""` (vazio) | ignorado silenciosamente |
| `"José\nJOSÉ"` | `["José"]` — duplicata removida |
