# Guia de Deploy - Sistema de Gerenciamento de Eventos

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Conta no [Netlify](https://netlify.com)
3. Conta no [GitHub](https://github.com)

## 🚀 Passo a Passo

### 1. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **Settings** → **API**
3. Anote as seguintes informações:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** (SUPABASE_SERVICE_ROLE_KEY)

### 2. Executar Scripts SQL

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
10. `scripts/10-verify-migration.sql`
11. `scripts/11-debug-event-lists.sql`
12. `scripts/12-create-sample-lists.sql`
13. `scripts/13-fix-admin-user.sql`

### 3. Gerar NEXTAUTH_SECRET

Execute o script para gerar uma chave secreta:

\`\`\`bash
node scripts/generate-secret.js
\`\`\`

### 4. Criar Repositório GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit: Sistema de Gerenciamento de Eventos"
git remote add origin https://github.com/SEU_USUARIO/venue-management-system.git
git push -u origin main
\`\`\`

### 5. Deploy no Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Clique em **New site from Git**
3. Conecte com GitHub
4. Selecione seu repositório
5. Configure:
   - **Build command**: `npm install --legacy-peer-deps && npm run build`
   - **Publish directory**: `.next`

### 6. Configurar Variáveis de Ambiente

No painel do Netlify, vá em **Site settings** → **Environment variables** e adicione:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
NEXT_PUBLIC_SITE_NAME=Sistema de Gerenciamento de Eventos
NEXTAUTH_SECRET=sua_chave_gerada
NEXTAUTH_URL=https://seu-site.netlify.app
\`\`\`

### 7. Testar o Deploy

1. Aguarde o build terminar
2. Acesse seu site
3. Teste o login com seu email
4. Verifique se você tem acesso de admin

## 🔧 Solução de Problemas

### Erro de Build
- Verifique se todas as variáveis estão configuradas
- Confirme que os scripts SQL foram executados

### Problema de Permissões
- Execute o script `13-fix-admin-user.sql`
- Verifique se seu email está correto no script

### Erro de Autenticação
- Confirme as variáveis do Supabase
- Verifique se o NEXTAUTH_URL está correto

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs de build no Netlify
2. Console do navegador
3. Logs do Supabase

## ✅ Checklist Final

- [ ] Supabase configurado
- [ ] Scripts SQL executados
- [ ] Variáveis de ambiente configuradas
- [ ] Site funcionando
- [ ] Login funcionando
- [ ] Permissões corretas
