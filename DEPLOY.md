# Guia de Deploy - Sistema de Gerenciamento de Eventos

## 📋 Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Netlify](https://netlify.com)
- Conta no [Supabase](https://supabase.com)

## 🚀 Passo a Passo

### 1. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá em **Settings** → **API**
4. Anote as seguintes informações:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** (SUPABASE_SERVICE_ROLE_KEY)

### 2. Gerar Chave Secreta

Execute o script para gerar o NEXTAUTH_SECRET:

\`\`\`bash
node scripts/generate-secret.js
\`\`\`

### 3. Configurar GitHub

1. Crie um repositório no GitHub
2. Clone o repositório localmente
3. Adicione os arquivos do projeto:

\`\`\`bash
git init
git add .
git commit -m "Initial commit: Sistema de Gerenciamento de Eventos"
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
git push -u origin main
\`\`\`

### 4. Deploy no Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Clique em **"New site from Git"**
3. Conecte com GitHub
4. Selecione seu repositório
5. Configure:
   - **Build command**: `npm ci && npm run build`
   - **Publish directory**: `.next`

### 5. Configurar Variáveis de Ambiente

No painel do Netlify, vá em **Site settings** → **Environment variables** e adicione:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
NEXT_PUBLIC_SITE_NAME=Sistema de Gerenciamento de Eventos
NEXTAUTH_SECRET=sua-chave-gerada
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

### 7. Testar o Deploy

1. Acesse sua URL do Netlify
2. Teste o login
3. Verifique todas as funcionalidades

## 🔧 Solução de Problemas

### Build Falha
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme que os scripts SQL foram executados
- Verifique os logs de build no Netlify

### Erro de Autenticação
- Confirme as variáveis do Supabase
- Verifique se o NEXTAUTH_URL está correto
- Teste a conexão com o banco

### Problemas de Dependências
- Use `npm ci` em vez de `npm install`
- Verifique se o Node.js está na versão 18+

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Netlify
2. Confirme as variáveis de ambiente
3. Teste localmente primeiro
4. Verifique a documentação do Supabase
