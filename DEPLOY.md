# Guia de Deploy - Sistema de Gerenciamento de Eventos

## 📋 Pré-requisitos

1. **Conta no GitHub** - Para hospedar o código
2. **Conta no Supabase** - Para banco de dados e autenticação
3. **Conta no Netlify** - Para deploy da aplicação

## 🚀 Passo a Passo

### 1. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote as seguintes informações em **Settings > API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

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

### 3. Gerar Chave Secreta

Execute o script para gerar o `NEXTAUTH_SECRET`:

\`\`\`bash
node scripts/generate-secret.js
\`\`\`

### 4. Configurar GitHub

\`\`\`bash
# Inicializar repositório
git init
git add .
git commit -m "Initial commit: Sistema de Gerenciamento de Eventos"

# Conectar com GitHub (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/venue-management-system.git
git push -u origin main
\`\`\`

### 5. Deploy no Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Clique em **"New site from Git"**
3. Conecte com GitHub
4. Selecione seu repositório
5. Configure:
   - **Build command**: `npm install --legacy-peer-deps && npm run build`
   - **Publish directory**: `.next`

### 6. Configurar Variáveis de Ambiente

No painel do Netlify, vá em **Site settings > Environment variables** e adicione:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase
NEXTAUTH_SECRET=sua_chave_secreta_gerada
NEXTAUTH_URL=https://seu-site.netlify.app
NEXT_PUBLIC_SITE_NAME=Sistema de Eventos
\`\`\`

### 7. Finalizar Deploy

1. Clique em **"Deploy site"**
2. Aguarde o build completar
3. Teste o site em produção

## 🔧 Solução de Problemas

### Build Falha
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme que os scripts SQL foram executados no Supabase
- Verifique os logs de build no Netlify

### Erro de Autenticação
- Confirme que `NEXTAUTH_URL` aponta para sua URL do Netlify
- Verifique se `NEXTAUTH_SECRET` foi gerado corretamente

### Erro de Banco de Dados
- Confirme que as variáveis do Supabase estão corretas
- Verifique se os scripts SQL foram executados na ordem correta

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs de build no Netlify
2. Console do navegador para erros JavaScript
3. Logs do Supabase para erros de banco de dados

## 🎯 Próximos Passos

Após o deploy bem-sucedido:
1. Crie o primeiro usuário admin
2. Configure os tipos de lista
3. Teste todas as funcionalidades
4. Configure backup automático do banco de dados
