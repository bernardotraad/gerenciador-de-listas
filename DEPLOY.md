# 🚀 Guia de Deploy - Sistema de Gerenciamento de Eventos

## 📋 Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Netlify](https://netlify.com)
- Conta no [Supabase](https://supabase.com)
- Node.js 18+ instalado

## 🔧 Configuração das Variáveis de Ambiente

### 1. Supabase (Banco de Dados)
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings** → **API**
4. Copie as seguintes informações:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (mantenha secreta)

### 2. Gerar NEXTAUTH_SECRET
Execute no terminal:
\`\`\`bash
openssl rand -base64 32
\`\`\`
Ou use o script fornecido: `node scripts/generate-secret.js`

### 3. Configurar NEXTAUTH_URL
Após o primeiro deploy, será a URL do seu site Netlify (ex: `https://seu-site.netlify.app`)

## 🚀 Deploy no Netlify

### Passo 1: Preparar o Repositório
\`\`\`bash
# Inicializar Git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "feat: Sistema de Gerenciamento de Eventos completo"

# Conectar com GitHub (substitua pela sua URL)
git remote add origin https://github.com/SEU_USUARIO/venue-management-system.git

# Enviar para GitHub
git push -u origin main
\`\`\`

### Passo 2: Configurar no Netlify
1. Acesse [netlify.com](https://netlify.com)
2. Clique em **"New site from Git"**
3. Conecte com **GitHub**
4. Selecione seu repositório
5. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: `18`

### Passo 3: Adicionar Variáveis de Ambiente
No painel do Netlify, vá em **Site settings** → **Environment variables** e adicione:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica
SUPABASE_SERVICE_ROLE_KEY=sua_chave_privada
NEXT_PUBLIC_SITE_NAME=Sistema de Eventos
NEXTAUTH_SECRET=sua_chave_gerada
NEXTAUTH_URL=https://seu-site.netlify.app
\`\`\`

## 🗄️ Configuração do Banco de Dados

### Executar Scripts SQL no Supabase
No painel do Supabase, vá em **SQL Editor** e execute os scripts na ordem:

1. `scripts/01-create-tables.sql` - Criar tabelas
2. `scripts/02-seed-data.sql` - Dados iniciais
3. `scripts/03-update-guest-lists.sql` - Atualizar listas
4. `scripts/04-add-public-submissions.sql` - Submissões públicas
5. `scripts/05-add-site-settings.sql` - Configurações do site
6. `scripts/06-fix-site-settings.sql` - Correções
7. `scripts/07-add-portaria-role.sql` - Role de portaria
8. `scripts/08-add-list-types.sql` - Tipos de lista

## ✅ Verificação Final

1. **Teste o login** com o usuário admin criado
2. **Verifique as funcionalidades** principais
3. **Teste a responsividade** mobile
4. **Confirme as permissões** de cada role

## 🔒 Segurança

- ✅ Variáveis sensíveis configuradas
- ✅ HTTPS habilitado automaticamente
- ✅ Headers de segurança configurados
- ✅ Autenticação implementada

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Netlify
2. Confirme as variáveis de ambiente
3. Teste localmente primeiro
4. Verifique a conexão com Supabase

---

**🎉 Seu sistema está pronto para uso em produção!**
