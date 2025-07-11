# Guia de Deploy - Sistema de Gerenciamento de Eventos

## 📋 Pré-requisitos

1. **Conta no GitHub** - Para hospedar o código
2. **Conta no Supabase** - Para banco de dados e autenticação
3. **Conta no Netlify** - Para deploy e hospedagem

## 🚀 Passo a Passo

### 1. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Preencha os dados do projeto:
   - **Name**: Sistema de Eventos
   - **Database Password**: Crie uma senha forte
   - **Region**: South America (São Paulo)
5. Aguarde a criação do projeto (2-3 minutos)

### 2. Obter Variáveis do Supabase

1. No painel do Supabase, vá em **Settings** → **API**
2. Anote as seguintes informações:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ mantenha secreta)

### 3. Executar Scripts SQL

1. No Supabase, vá em **SQL Editor**
2. Execute os scripts na ordem:
   - `01-create-tables.sql`
   - `02-seed-data.sql`
   - `03-update-guest-lists.sql`
   - `04-add-public-submissions.sql`
   - `05-add-site-settings.sql`
   - `06-fix-site-settings.sql`
   - `07-add-portaria-role.sql`
   - `08-add-list-types.sql`

### 4. Gerar NEXTAUTH_SECRET

Execute o script para gerar uma chave secreta:

\`\`\`bash
node scripts/generate-secret.js
\`\`\`

Copie o valor gerado.

### 5. Criar Repositório no GitHub

\`\`\`bash
# Inicializar repositório
git init
git add .
git commit -m "Initial commit: Sistema de Gerenciamento de Eventos"

# Conectar com GitHub (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/venue-management-system.git
git push -u origin main
\`\`\`

### 6. Deploy no Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Clique em "New site from Git"
3. Conecte com GitHub
4. Selecione seu repositório
5. Configure:
   - **Build command**: `npm install --legacy-peer-deps && npm run build`
   - **Publish directory**: `.next`

### 7. Configurar Variáveis de Ambiente

No painel do Netlify, vá em **Site settings** → **Environment variables** e adicione:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase
NEXT_PUBLIC_SITE_NAME=Sistema de Gerenciamento de Eventos
NEXTAUTH_SECRET=sua_chave_secreta_gerada
NEXTAUTH_URL=https://seu-site.netlify.app
\`\`\`

### 8. Primeiro Deploy

1. Clique em "Deploy site"
2. Aguarde o build completar
3. Teste o site na URL fornecida

## 🔧 Solução de Problemas

### Build Falha
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme que os scripts SQL foram executados no Supabase

### Erro de Autenticação
- Verifique se `NEXTAUTH_URL` está correto
- Confirme se `NEXTAUTH_SECRET` foi configurado

### Erro de Banco de Dados
- Verifique se as variáveis do Supabase estão corretas
- Confirme se os scripts SQL foram executados na ordem correta

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs de build no Netlify
2. Confirme todas as variáveis de ambiente
3. Teste localmente primeiro com `npm run dev`

## 🎉 Pronto!

Seu sistema está no ar! Acesse a URL fornecida pelo Netlify e comece a usar.
