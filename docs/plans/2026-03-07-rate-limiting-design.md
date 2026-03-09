# Design: Rate Limiting via Supabase

**Data:** 2026-03-07
**Status:** Aprovado
**Escopo:** `lib/actions/submissoes.ts`

## Abordagem

Rate limit baseado em Supabase — conta submissões por IP na última hora usando a tabela `guest_submissions` já existente.

## Mudanças em `criarSubmissao`

1. Capturar IP via `headers()` do Next.js (`x-forwarded-for` → `x-real-ip` → `'unknown'`)
2. Antes do insert: contar rows em `guest_submissions` onde `submission_ip = ip AND created_at >= now - 1h`
3. Se count >= 10: retornar `{ error: 'Limite de 10 submissões por hora atingido.' }`
4. Adicionar `submission_ip` ao insert (campo já existia mas não era preenchido)

## Sem novas dependências
