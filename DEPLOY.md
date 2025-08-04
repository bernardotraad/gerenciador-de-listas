# Guia de Deploy - Sistema de Gerenciamento de Eventos

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Conta no [Vercel](https://vercel.com)
3. Conta no [GitHub](https://github.com)

## 🚀 Passo a Passo

### 1. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Vá em **Settings** → **API**
3. Anote as seguintes informações:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** (SUPABASE_SERVICE_ROLE_KEY)

### 2. Configurar a Database

No Supabase, vá em **SQL Editor** e execute o script principal:

```sql
-- Execute o script completo de configuração
-- Copie e cole o conteúdo de: scripts/00-setup-database-complete.sql
```

📖 **Guia detalhado**: Veja [scripts/README-INSTALACAO.md](scripts/README-INSTALACAO.md)

### 3. Gerar NEXTAUTH_SECRET

Execute o script para gerar uma chave secreta:

```bash
node scripts/generate-secret.js
```

### 4. Criar Repositório GitHub

```bash
git init
git add .
git commit -m "Initial commit: Sistema de Gerenciamento de Eventos"
git remote add origin https://github.com/SEU_USUARIO/gerenciador-de-listas.git
git push -u origin main
```

### 5. Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **New Project**
3. Conecte com GitHub
4. Selecione seu repositório
5. O Vercel detectará automaticamente que é um projeto Next.js

### 6. Configurar Variáveis de Ambiente

No painel do Vercel, vá em **Settings** → **Environment Variables** e adicione:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Auth
NEXTAUTH_SECRET=sua_chave_gerada
NEXTAUTH_URL=https://seu-site.vercel.app

# Site
NEXT_PUBLIC_SITE_NAME=Sistema de Gerenciamento de Eventos
```

### 7. Configurar Domínio Personalizado (Opcional)

1. No Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruções

### 8. Testar o Deploy

1. Aguarde o build terminar
2. Acesse seu site
3. Teste o login com os dados padrão:
   - **admin@casadeshow.com** (admin)
   - **user@casadeshow.com** (user)
   - **portaria@casadeshow.com** (portaria)

## 🔧 Vantagens do Vercel

### ✅ **Performance**
- Edge Network global
- Otimização automática para Next.js
- Cache inteligente

### ✅ **Desenvolvimento**
- Preview deployments automáticos
- Integração nativa com Next.js
- Hot reload em desenvolvimento

### ✅ **Monitoramento**
- Analytics integrados
- Logs detalhados
- Métricas de performance

### ✅ **Segurança**
- HTTPS automático
- Headers de segurança configurados
- Proteção contra DDoS

## 🔧 Solução de Problemas

### Erro de Build
- Verifique se todas as variáveis estão configuradas
- Confirme que os scripts SQL foram executados
- Verifique os logs no Vercel

### Problema de Permissões
- Execute o script `13-fix-admin-user.sql` se necessário
- Verifique se seu email está correto no script

### Erro de Autenticação
- Confirme as variáveis do Supabase
- Verifique se o NEXTAUTH_URL está correto
- Teste com os usuários padrão primeiro

### Problemas de Performance
- Verifique se a região do Vercel está próxima
- Configure cache adequadamente
- Otimize imagens e assets

## 📊 Monitoramento

### Vercel Analytics
1. Vá em **Analytics** no painel do Vercel
2. Configure o tracking
3. Monitore métricas de performance

### Logs
1. Vá em **Functions** → **View Function Logs**
2. Monitore erros e performance
3. Configure alertas se necessário

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs de build no Vercel
2. Console do navegador
3. Logs do Supabase
4. [Documentação do Vercel](https://vercel.com/docs)

## ✅ Checklist Final

- [ ] Supabase configurado
- [ ] Script de database executado
- [ ] Variáveis de ambiente configuradas
- [ ] Site funcionando
- [ ] Login funcionando
- [ ] Permissões corretas
- [ ] Domínio configurado (opcional)
- [ ] Analytics configurado (opcional)

## 🚀 Próximos Passos

1. **Personalizar o sistema** conforme suas necessidades
2. **Configurar domínio personalizado** se necessário
3. **Configurar analytics** para monitoramento
4. **Configurar backups** do Supabase
5. **Testar todas as funcionalidades** em produção

---

**🎉 Parabéns! Seu sistema está no ar e funcionando!**
