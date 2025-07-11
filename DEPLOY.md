# Guia de Deploy - Sistema de Gerenciamento de Eventos

## 📋 Pré-requisitos

1. **Conta no GitHub** - Para hospedar o código
2. **Conta no Supabase** - Para banco de dados
3. **Conta no Netlify** - Para deploy da aplicação

## 🚀 Passo a Passo

### 1. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings → API**
4. Anote estas 3 variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL` (Project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon public)
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role - ⚠️ mantenha secreta)

### 2. Gerar Chave Secreta

Execute no terminal:
\`\`\`bash
node scripts/generate-secret.js
\`\`\`
Anote o valor gerado para `NEXTAUTH_SECRET`.

### 3. Criar Repositório GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit: Sistema de Gerenciamento de Eventos"
git remote add origin https://github.com/SEU_USUARIO/venue-management-system.git
git push -u origin main
\`\`\`

### 4. Deploy no Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Clique em **"New site from Git"**
3. Conecte com GitHub
4. Selecione seu repositório
5. Configure:
   - **Build command**: `rm -rf node_modules pnpm-lock.yaml package-lock.json && npm install --legacy-peer-deps && npm run build`
   - **Publish directory**: `.next`

### 5. Configurar Variáveis de Ambiente

No painel do Netlify, vá em **Site settings → Environment variables** e adicione:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
NEXT_PUBLIC_SITE_NAME=Sistema de Gerenciamento de Eventos
NEXTAUTH_SECRET=sua_chave_gerada
NEXTAUTH_URL=https://seu-site.netlify.app
\`\`\`

### 6. Executar Scripts SQL

No Supabase, vá em **SQL Editor** e execute os scripts na ordem:

1. `scripts/01-create-tables.sql`
2. `scripts/02-seed-data.sql`
3. `scripts/03-update-guest-lists.sql`
4. `scripts/04-add-public-submissions.sql`
5. `scripts/05-add-site-settings.sql`
6. `scripts/06-fix-site-settings.sql`
7. `scripts/07-add-portaria-role.sql`
8. `scripts/08-add-list-types.sql`
9. `scripts/09-migrate-existing-guests-fixed.sql`

### 7. Testar o Sistema

1. Acesse sua URL do Netlify
2. Faça login com as credenciais padrão
3. Teste as funcionalidades principais

## 🔧 Solução de Problemas

### Build Falha
- Verifique se todas as variáveis estão configuradas
- Confirme que os scripts SQL foram executados
- Verifique os logs de build no Netlify

### Erro de Autenticação
- Confirme as variáveis do Supabase
- Verifique se o NEXTAUTH_SECRET foi configurado
- Confirme a NEXTAUTH_URL

### Banco de Dados
- Execute os scripts SQL na ordem correta
- Verifique as permissões no Supabase
- Confirme a conexão com o banco

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs de build no Netlify
2. Console do navegador
3. Logs do Supabase
4. Variáveis de ambiente
