# Guia de Deploy - Sistema de Gerenciamento de Eventos

Este guia te ajudará a fazer o deploy do sistema no Netlify usando Supabase como banco de dados.

## 📋 Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Netlify](https://netlify.com)
- Conta no [Supabase](https://supabase.com)

## 🚀 Passo a Passo

### 1. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá em **Settings** → **API**
4. Anote estas 3 variáveis:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** (SUPABASE_SERVICE_ROLE_KEY)

### 2. Gerar Chave Secreta

Execute o comando no terminal:
\`\`\`bash
node scripts/generate-secret.js
\`\`\`

Anote o valor gerado para usar como `NEXTAUTH_SECRET`.

### 3. Criar Repositório no GitHub

\`\`\`bash
# No terminal, na pasta do projeto:
git init
git add .
git commit -m "Initial commit: Sistema de Gerenciamento de Eventos"

# Crie um repositório no GitHub e depois:
git remote add origin https://github.com/SEU_USUARIO/venue-management-system.git
git push -u origin main
\`\`\`

### 4. Deploy no Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Clique em **"New site from Git"**
3. Conecte com GitHub
4. Selecione seu repositório
5. As configurações de build já estão no `netlify.toml`
6. Clique em **"Deploy site"**

### 5. Configurar Variáveis de Ambiente

No painel do Netlify, vá em **Site settings** → **Environment variables** e adicione:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase
NEXT_PUBLIC_SITE_NAME=Sistema de Eventos
NEXTAUTH_SECRET=sua_chave_secreta_gerada
NEXTAUTH_URL=https://seu-site.netlify.app
\`\`\`

### 6. Executar Scripts SQL

No painel do Supabase, vá em **SQL Editor** e execute os scripts na ordem:

1. `scripts/01-create-tables.sql`
2. `scripts/02-seed-data.sql`
3. `scripts/03-update-guest-lists.sql`
4. `scripts/04-add-public-submissions.sql`
5. `scripts/05-add-site-settings.sql`
6. `scripts/06-fix-site-settings.sql`
7. `scripts/07-add-portaria-role.sql`
8. `scripts/08-add-list-types.sql`

### 7. Testar o Sistema

1. Acesse seu site no Netlify
2. Faça login com as credenciais padrão:
   - **Email**: admin@sistema.com
   - **Senha**: admin123
3. Teste as funcionalidades principais

## 🔧 Solução de Problemas

### Build Falha
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme que os scripts SQL foram executados
- Veja os logs de build no Netlify

### Erro de Autenticação
- Confirme as variáveis do Supabase
- Verifique se o NEXTAUTH_URL está correto
- Execute os scripts SQL na ordem correta

### Banco de Dados
- Execute os scripts SQL no Supabase
- Verifique as permissões RLS (Row Level Security)
- Confirme a estrutura das tabelas

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Netlify
2. Confirme as variáveis de ambiente
3. Execute os scripts SQL novamente
4. Teste localmente primeiro

## 🎯 Próximos Passos

Após o deploy bem-sucedido:
- [ ] Configurar domínio personalizado
- [ ] Configurar SSL/HTTPS
- [ ] Configurar backups do banco
- [ ] Monitorar performance
- [ ] Configurar notificações
