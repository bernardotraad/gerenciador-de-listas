# 🚀 Guia de Deploy - Sistema de Gerenciamento de Eventos

Este guia te ajudará a fazer o deploy do sistema no Netlify com Supabase.

## 📋 Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Netlify](https://netlify.com)
- Conta no [Supabase](https://supabase.com)
- Node.js 18+ instalado

## 🔧 Configuração das Variáveis de Ambiente

### 1. Supabase (3 variáveis)

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto ou acesse um existente
3. Vá em **Settings** → **API**
4. Copie os valores:
   - **NEXT_PUBLIC_SUPABASE_URL**: Project URL
   - **NEXT_PUBLIC_SUPABASE_ANON_KEY**: anon public key
   - **SUPABASE_SERVICE_ROLE_KEY**: service_role key (⚠️ mantenha secreta)

### 2. Gerar NEXTAUTH_SECRET

Execute no terminal:
\`\`\`bash
node scripts/generate-secret.js
\`\`\`

### 3. Configurar NEXTAUTH_URL

Após o primeiro deploy, será a URL do seu site Netlify:
\`\`\`
https://seu-site.netlify.app
\`\`\`

## 🚀 Deploy no Netlify

### Passo 1: Preparar o Repositório

\`\`\`bash
# Clone ou baixe o projeto
git init
git add .
git commit -m "Initial commit: Sistema de Gerenciamento de Eventos"

# Conecte com seu repositório GitHub
git remote add origin https://github.com/SEU_USUARIO/venue-management-system.git
git push -u origin main
\`\`\`

### Passo 2: Configurar no Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Clique em **"New site from Git"**
3. Conecte com GitHub
4. Selecione seu repositório
5. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: `18`

### Passo 3: Adicionar Variáveis de Ambiente

No painel do Netlify, vá em **Site settings** → **Environment variables** e adicione:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
NEXT_PUBLIC_SITE_NAME=Sistema de Gerenciamento de Eventos
NEXTAUTH_SECRET=sua_chave_gerada
NEXTAUTH_URL=https://seu-site.netlify.app
\`\`\`

### Passo 4: Configurar Banco de Dados

Execute os scripts SQL no Supabase **nesta ordem**:

1. `scripts/01-create-tables.sql`
2. `scripts/02-seed-data.sql`
3. `scripts/03-update-guest-lists.sql`
4. `scripts/04-add-public-submissions.sql`
5. `scripts/05-add-site-settings.sql`
6. `scripts/06-fix-site-settings.sql`
7. `scripts/07-add-portaria-role.sql`
8. `scripts/08-add-list-types.sql`
9. `scripts/09-migrate-existing-guests-fixed.sql`

## ✅ Verificação

Após o deploy:

1. ✅ Site carrega sem erros
2. ✅ Login funciona
3. ✅ Páginas principais acessíveis
4. ✅ Criação de eventos funciona
5. ✅ Sistema de permissões ativo

## 🔧 Solução de Problemas

### Build Falha
- Verifique se todas as variáveis estão configuradas
- Confirme que os scripts SQL foram executados
- Verifique logs do Netlify

### Erro de Autenticação
- Confirme NEXTAUTH_URL está correto
- Verifique chaves do Supabase
- Teste NEXTAUTH_SECRET

### Banco de Dados
- Execute scripts na ordem correta
- Verifique permissões RLS no Supabase
- Confirme service_role_key

## 📞 Suporte

Se encontrar problemas:
1. Verifique logs do Netlify
2. Teste localmente primeiro
3. Confirme todas as variáveis
4. Execute scripts SQL novamente se necessário

---

**🎉 Parabéns! Seu sistema está no ar!**
