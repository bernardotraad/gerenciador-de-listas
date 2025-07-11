# 🚀 Guia Completo de Deploy - Sistema de Gerenciamento de Listas

## 📋 Pré-requisitos

- [ ] Conta no GitHub
- [ ] Conta no Supabase (configurada)
- [ ] Conta no Netlify
- [ ] Node.js 18+ instalado localmente

## 🔧 1. Preparação do Supabase

### 1.1 Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha sua organização
4. Configure:
   - **Nome**: Sistema Gerenciamento Listas
   - **Database Password**: Use um password forte
   - **Region**: Escolha a mais próxima (South America - São Paulo)
5. Aguarde a criação (2-3 minutos)
6. Anote as credenciais:
   - **Project URL**: `https://seu-projeto.supabase.co`
   - **Anon Key**: Chave pública
   - **Service Role Key**: Chave privada (mantenha segura!)

### 1.2 Executar Scripts SQL
Execute os scripts **na ordem exata** no SQL Editor do Supabase:

#### **Estrutura Básica (Obrigatório)**
\`\`\`sql
-- 1. Criar todas as tabelas e estrutura
\i scripts/01-create-tables.sql

-- 2. Inserir dados iniciais básicos
\i scripts/02-seed-data.sql
\`\`\`

#### **Funcionalidades Avançadas (Obrigatório)**
\`\`\`sql
-- 3. Atualizações nas listas de convidados
\i scripts/03-update-guest-lists.sql

-- 4. Sistema de envios públicos
\i scripts/04-add-public-submissions.sql

-- 5. Configurações do sistema
\i scripts/05-add-site-settings.sql

-- 6. Correções nas configurações
\i scripts/06-fix-site-settings.sql

-- 7. Adicionar cargo de portaria
\i scripts/07-add-portaria-role.sql
\`\`\`

#### **Tipos e Organização (Obrigatório)**
\`\`\`sql
-- 8. Tipos de lista (VIP, Camarote, etc.)
\i scripts/08-add-list-types.sql

-- 9. Migração de dados existentes
\i scripts/09-migrate-existing-guests-fixed.sql

-- 10. Verificar integridade da migração
\i scripts/10-verify-migration.sql
\`\`\`

#### **Dados de Exemplo (Opcional)**
\`\`\`sql
-- 11. Debug e análise do sistema
\i scripts/11-debug-event-lists.sql

-- 12. Criar listas de exemplo para teste
\i scripts/12-create-sample-lists.sql
\`\`\`

### 1.3 Configurar RLS (Row Level Security)
\`\`\`sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de segurança
CREATE POLICY "Enable read access for authenticated users" ON events 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON guest_lists 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can read own data" ON users 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage users" ON users 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
\`\`\`

### 1.4 Configurar Autenticação
1. Vá em **Authentication > Settings**
2. Configure:
   - **Site URL**: `https://seu-site.netlify.app`
   - **Redirect URLs**: `https://seu-site.netlify.app/auth/callback`
3. Desabilite **Email Confirmations** para desenvolvimento
4. Configure **Email Templates** se necessário

## 📂 2. Publicar no GitHub

### 2.1 Criar Repositório
\`\`\`bash
# Navegar para pasta do projeto
cd venue-management-system

# Inicializar git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Primeiro commit
git commit -m "🎉 Initial commit - Sistema de Gerenciamento de Listas v2.0"

# Criar repositório no GitHub (via web ou CLI)
gh repo create venue-management-system --public

# Conectar com GitHub
git remote add origin https://github.com/SEU_USUARIO/venue-management-system.git

# Push inicial
git push -u origin main
\`\`\`

### 2.2 Configurar Secrets do GitHub
No seu repositório GitHub, vá em **Settings > Secrets and variables > Actions**:

#### **Repository Secrets:**
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
NETLIFY_AUTH_TOKEN=seu_token_netlify_aqui
NETLIFY_SITE_ID=seu_site_id_netlify_aqui
\`\`\`

#### **Como obter o Netlify Token:**
1. Acesse [app.netlify.com/user/applications](https://app.netlify.com/user/applications)
2. Clique em "New access token"
3. Dê um nome: "GitHub Actions Deploy"
4. Copie o token gerado

## 🌐 3. Deploy no Netlify

### 3.1 Conectar Repositório
1. Acesse [netlify.com](https://netlify.com)
2. Clique em "New site from Git"
3. Conecte com GitHub
4. Selecione seu repositório `venue-management-system`
5. Configure branch: `main`

### 3.2 Configurar Build Settings
\`\`\`
Build command: npm run build
Publish directory: .next
Node version: 18
\`\`\`

### 3.3 Configurar Environment Variables
No painel do Netlify (**Site settings > Environment variables**):

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
\`\`\`

### 3.4 Configurar Redirects e Headers
O arquivo `netlify.toml` já está configurado com:

\`\`\`toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--production=false"

[[plugins]]
  package = "@netlify/plugin-nextjs"

# Redirects para SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Headers de segurança
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
\`\`\`

### 3.5 Deploy Manual (Primeira vez)
\`\`\`bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login no Netlify
netlify login

# Deploy inicial
netlify deploy --prod --dir=.next
\`\`\`

## ✅ 4. Verificação Pós-Deploy

### 4.1 Testar Funcionalidades Básicas
- [ ] **Página inicial** carrega sem erros
- [ ] **Envio de nomes público** funciona
- [ ] **Login/cadastro** funciona
- [ ] **Dashboard** carrega para usuários logados
- [ ] **Criação de eventos** funciona (admin)
- [ ] **Check-in** funciona (portaria)

### 4.2 Testar Responsividade
- [ ] **Desktop** (1920x1080)
- [ ] **Tablet** (768x1024)
- [ ] **Mobile** (375x667)
- [ ] **Menu mobile** funciona corretamente

### 4.3 Testar Performance
\`\`\`bash
# Lighthouse audit
npx lighthouse https://seu-site.netlify.app --output html

# Core Web Vitals
# - LCP < 2.5s
# - FID < 100ms
# - CLS < 0.1
\`\`\`

### 4.4 Configurar Domínio Personalizado (Opcional)
1. No Netlify: **Site settings > Domain management**
2. Clique em "Add custom domain"
3. Digite seu domínio: `casadeshow.com`
4. Configure DNS:
   \`\`\`
   Type: CNAME
   Name: www
   Value: seu-site.netlify.app
   
   Type: A
   Name: @
   Value: 75.2.60.5
   \`\`\`

## 🔧 5. Configurações Avançadas

### 5.1 Monitoramento e Analytics
\`\`\`javascript
// Google Analytics (opcional)
// Adicionar em app/layout.tsx
<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
  strategy="afterInteractive"
/>
\`\`\`

### 5.2 Backup Automático
\`\`\`sql
-- Criar função de backup no Supabase
CREATE OR REPLACE FUNCTION backup_data()
RETURNS void AS $$
BEGIN
  -- Backup logic aqui
  INSERT INTO backups (data, created_at) 
  VALUES (row_to_json(users.*), NOW());
END;
$$ LANGUAGE plpgsql;

-- Agendar backup diário
SELECT cron.schedule('daily-backup', '0 2 * * *', 'SELECT backup_data();');
\`\`\`

### 5.3 Configurar Notificações
\`\`\`javascript
// Webhook para Slack/Discord (opcional)
// Em app/api/webhooks/deploy/route.ts
export async function POST(request) {
  const payload = await request.json();
  
  // Notificar deploy bem-sucedido
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚀 Deploy realizado com sucesso! Site: ${payload.url}`
    })
  });
}
\`\`\`

## 🚨 6. Troubleshooting

### 6.1 Erros Comuns de Build
\`\`\`bash
# Erro: Module not found
npm install --save-dev @types/node

# Erro: TypeScript
npm run type-check

# Erro: ESLint
npm run lint -- --fix

# Limpar cache
rm -rf .next node_modules package-lock.json
npm install
\`\`\`

### 6.2 Erros de Environment Variables
\`\`\`bash
# Verificar variáveis localmente
echo $NEXT_PUBLIC_SUPABASE_URL

# Verificar no Netlify
netlify env:list

# Definir variável
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://seu-projeto.supabase.co"
\`\`\`

### 6.3 Erros de Database
\`\`\`sql
-- Verificar conexão
SELECT NOW();

-- Verificar tabelas
\dt

-- Verificar dados
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM events;
SELECT COUNT(*) FROM guest_lists;

-- Reset se necessário
\i scripts/99-reset-database.sql
\`\`\`

### 6.4 Erros de Autenticação
1. Verificar **Site URL** no Supabase
2. Verificar **Redirect URLs**
3. Verificar **RLS Policies**
4. Testar login manual no Supabase

## 📱 7. Configuração Mobile

### 7.1 PWA (Progressive Web App)
\`\`\`javascript
// next.config.mjs
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  // configurações
});
\`\`\`

### 7.2 Manifest
\`\`\`json
// public/manifest.json
{
  "name": "Sistema de Gerenciamento de Listas",
  "short_name": "Gestão Listas",
  "description": "Sistema para gerenciar listas de convidados",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
\`\`\`

## 📊 8. Monitoramento Pós-Deploy

### 8.1 Métricas Importantes
- **Uptime**: > 99.9%
- **Response Time**: < 200ms
- **Error Rate**: < 0.1%
- **Core Web Vitals**: Todos verdes

### 8.2 Ferramentas de Monitoramento
- **Netlify Analytics**: Tráfego e performance
- **Supabase Dashboard**: Database metrics
- **GitHub Actions**: Build status
- **Google Search Console**: SEO

### 8.3 Alertas Automáticos
\`\`\`yaml
# .github/workflows/monitor.yml
name: Monitor Site
on:
  schedule:
    - cron: '*/5 * * * *'  # A cada 5 minutos

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Check site status
        run: |
          curl -f https://seu-site.netlify.app || exit 1
\`\`\`

## 🎯 9. Próximos Passos

### 9.1 Configuração Inicial
1. **Executar script de reset**: `99-reset-database.sql`
2. **Fazer login**: `admin@admin.com` / `admin123`
3. **Configurar nome do site**: Ir em Configurações
4. **Criar primeiro evento**: Definir data, local, etc.
5. **Configurar tipos de lista**: VIP, Camarote, etc.
6. **Adicionar setores**: Principal, Bar, etc.

### 9.2 Treinamento da Equipe
1. **Admin**: Gerenciamento completo
2. **Portaria**: Check-in e listas
3. **Users**: Envio de nomes
4. **Público**: Como enviar nomes

### 9.3 Backup e Segurança
1. **Backup diário** do banco
2. **Monitoramento** de logs
3. **Atualizações** de segurança
4. **Testes** regulares

---

## 📞 Suporte Técnico

### 🆘 **Em caso de problemas:**
1. **Verificar logs** do Netlify
2. **Verificar logs** do Supabase  
3. **Verificar GitHub Actions**
4. **Consultar documentação**
5. **Abrir issue** no repositório

### 📧 **Contatos:**
- **Email**: suporte@casadeshow.com
- **GitHub**: [Issues do Projeto](https://github.com/seu-usuario/venue-management-system/issues)
- **Documentação**: [Wiki Completa](https://github.com/seu-usuario/venue-management-system/wiki)

---

**Deploy realizado com sucesso! 🎉**

*Sistema de Gerenciamento de Listas v2.0 - Pronto para produção!*
