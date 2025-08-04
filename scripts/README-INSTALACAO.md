# 🚀 Guia de Instalação - Gerenciador de Listas

Este guia irá ajudá-lo a configurar a database do Gerenciador de Listas no Supabase do zero.

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Projeto Supabase criado
- Acesso ao SQL Editor do Supabase

## 🛠️ Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha sua organização
5. Digite um nome para o projeto (ex: "gerenciador-listas")
6. Escolha uma senha forte para o banco de dados
7. Escolha uma região próxima
8. Clique em "Create new project"

### 2. Configurar a Database

1. No seu projeto Supabase, vá para **SQL Editor**
2. Clique em **"New query"**
3. Copie todo o conteúdo do arquivo `00-setup-database-complete.sql`
4. Cole no editor SQL
5. Clique em **"Run"** para executar o script

### 3. Verificar a Instalação

Após executar o script, você deve ver uma mensagem de confirmação. Verifique se as tabelas foram criadas:

1. Vá para **Table Editor** no menu lateral
2. Você deve ver as seguintes tabelas:
   - `users`
   - `events`
   - `list_types`
   - `sectors`
   - `event_lists`
   - `guest_lists`
   - `activity_logs`
   - `site_settings`

### 4. Configurar Variáveis de Ambiente

No seu projeto Next.js, configure as seguintes variáveis de ambiente:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase

# Auth
NEXTAUTH_SECRET=seu_secret_para_nextauth
NEXTAUTH_URL=http://localhost:3000
```

### 5. Configurar Supabase Auth (Opcional)

Se você quiser usar autenticação do Supabase:

1. Vá para **Authentication** > **Settings**
2. Configure os provedores de autenticação desejados
3. Configure as URLs de redirecionamento

## 📊 Dados Iniciais Criados

O script cria automaticamente:

### Usuários Padrão
- **admin@casadeshow.com** (admin) - Acesso total ao sistema
- **user@casadeshow.com** (user) - Usuário comum
- **portaria@casadeshow.com** (portaria) - Acesso para check-in

### Tipos de Lista
- VIP (Dourado)
- Desconto (Verde)
- Aniversariante (Laranja)
- Imprensa (Roxo)
- Artista (Vermelho)
- Produção (Cinza)
- Cortesia (Ciano)
- Camarote (Rosa)

### Setores
- Pista (500 pessoas)
- Camarote A (50 pessoas)
- Camarote B (50 pessoas)
- VIP Lounge (30 pessoas)
- Backstage (20 pessoas)
- Bar Premium (40 pessoas)
- Mezanino (100 pessoas)
- Área Externa (80 pessoas)

### Evento de Exemplo
- **"Show de Rock - Banda XYZ"** com 3 listas de exemplo

## 🔧 Configurações do Sistema

O script também configura:

- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Políticas de segurança** para controle de acesso
- **Triggers** para atualização automática de contadores
- **Índices** para melhor performance
- **Configurações do site** padrão

## 🚨 Solução de Problemas

### Erro: "relation already exists"
- Execute o script apenas uma vez
- Se precisar recriar, use o script `00-reset-database.sql` primeiro

### Erro: "permission denied"
- Verifique se você tem permissões de administrador no projeto
- Certifique-se de que o projeto está ativo

### Erro: "function does not exist"
- Execute o script completo novamente
- Verifique se não há erros de sintaxe

## 📝 Próximos Passos

1. **Teste o sistema** com os dados de exemplo
2. **Personalize as configurações** conforme necessário
3. **Crie usuários reais** através do painel administrativo
4. **Configure eventos** para sua casa de show
5. **Teste o fluxo completo** de criação de listas e check-in

## 🚀 Deploy no Vercel

### 1. Conecte seu repositório
- Faça login no [Vercel](https://vercel.com)
- Clique em "New Project"
- Conecte seu repositório GitHub

### 2. Configure as variáveis de ambiente
No painel do Vercel, vá em Settings > Environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
NEXTAUTH_SECRET=seu_secret_para_nextauth
NEXTAUTH_URL=https://seu-site.vercel.app
```

### 3. Deploy automático
O site será deployado automaticamente a cada push na branch `main`.

📖 **Guia completo de deploy**: Veja [DEPLOY.md](../DEPLOY.md)

## 🔐 Segurança

- O script configura RLS (Row Level Security) por padrão
- As políticas de segurança controlam o acesso aos dados
- Senhas dos usuários padrão devem ser alteradas
- Configure autenticação adequada para produção

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs no SQL Editor
2. Consulte a documentação do Supabase
3. Abra uma issue no repositório do projeto

---

**🎉 Parabéns! Sua database está configurada e pronta para uso!** 