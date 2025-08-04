# 🎵 Sistema de Gerenciamento de Listas - Casa de Show

Sistema completo para gerenciamento de listas de convidados para casas de show, com funcionalidades de envio público, check-in e administração avançada.

## ✨ Funcionalidades

### 🎯 **Para o Público**
- ✅ Envio de listas de nomes sem necessidade de cadastro
- ✅ Formatação automática de nomes próprios
- ✅ Interface responsiva e intuitiva
- ✅ Seleção de eventos disponíveis
- ✅ Diferentes tipos de lista (VIP, Camarote, Pista, etc.)

### 👥 **Para Usuários Cadastrados**
- ✅ Dashboard personalizado com estatísticas em tempo real
- ✅ Envio de listas com dados pré-preenchidos
- ✅ Visualização de listas enviadas organizadas
- ✅ Histórico completo de atividades
- ✅ Filtros avançados e busca otimizada

### 🚪 **Para Portaria**
- ✅ Sistema de check-in em tempo real
- ✅ Busca rápida por nomes com autocomplete
- ✅ Controle de entrada e saída
- ✅ Estatísticas de presença por evento
- ✅ Interface mobile-first otimizada

### 🔧 **Para Administradores**
- ✅ Gerenciamento completo de eventos e status
- ✅ Controle de usuários e permissões (Admin, User, Portaria)
- ✅ Logs detalhados de todas as atividades
- ✅ Configurações avançadas do sistema
- ✅ Relatórios e estatísticas completas
- ✅ Gerenciamento de tipos de lista e setores
- ✅ Scripts de reset e manutenção do banco

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth com RLS
- **Deploy**: Vercel com CI/CD
- **Monitoramento**: Vercel Analytics

## 🚀 Instalação Rápida

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no [Supabase](https://supabase.com)

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/gerenciador-de-listas.git
cd gerenciador-de-listas
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase

#### 3.1. Crie um projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e as chaves de API

#### 3.2. Configure a Database
1. No seu projeto Supabase, vá para **SQL Editor**
2. Execute o script `scripts/00-setup-database-complete.sql`
3. Verifique se todas as tabelas foram criadas no **Table Editor**

📖 **Guia detalhado**: Veja [README-INSTALACAO.md](scripts/README-INSTALACAO.md)

### 4. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Auth (opcional)
NEXTAUTH_SECRET=seu_secret_para_nextauth
NEXTAUTH_URL=http://localhost:3000
```

### 5. Execute o projeto
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📊 Dados Iniciais

O script de instalação cria automaticamente:

### 👤 Usuários Padrão
- **admin@casadeshow.com** (admin) - Acesso total
- **user@casadeshow.com** (user) - Usuário comum  
- **portaria@casadeshow.com** (portaria) - Check-in

### 🎫 Tipos de Lista
- VIP, Desconto, Aniversariante, Imprensa, Artista, Produção, Cortesia, Camarote

### 🏢 Setores
- Pista, Camarotes A/B, VIP Lounge, Backstage, Bar Premium, Mezanino, Área Externa

### 🎪 Evento de Exemplo
- "Show de Rock - Banda XYZ" com 3 listas de exemplo

## 🔧 Scripts Disponíveis

### Instalação
- `00-setup-database-complete.sql` - **Script principal** para instalação completa
- `00-reset-database.sql` - Reset completo da database

### Manutenção
- `01-create-tables.sql` até `13-fix-admin-user.sql` - Scripts individuais para migrações

📖 **Documentação completa**: Veja a pasta [scripts/](scripts/) para todos os scripts disponíveis

## 🚀 Como Executar Localmente (Método Alternativo)

Se preferir usar os scripts individuais:

### Configure o banco de dados
Execute os scripts SQL na pasta `scripts/` no seu Supabase na ordem:

1. **Estrutura básica:**
   - `01-create-tables.sql` - Criar todas as tabelas
   - `02-seed-data.sql` - Dados iniciais básicos

2. **Funcionalidades avançadas:**
   - `03-update-guest-lists.sql` - Atualizações nas listas
   - `04-add-public-submissions.sql` - Envios públicos
   - `05-add-site-settings.sql` - Configurações do sistema
   - `06-fix-site-settings.sql` - Correções nas configurações
   - `07-add-portaria-role.sql` - Cargo de portaria

3. **Tipos e organização:**
   - `08-add-list-types.sql` - Tipos de lista (VIP, Camarote, etc.)
   - `09-migrate-existing-guests-fixed.sql` - Migração de dados
   - `10-verify-migration.sql` - Verificação da migração

4. **Dados de exemplo:**
   - `11-debug-event-lists.sql` - Debug e análise
   - `12-create-sample-lists.sql` - Listas de exemplo

5. **Reset (opcional):**
   - `99-reset-database.sql` - Reset mantendo admins
   - `99-reset-database-custom.sql` - Reset personalizado

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
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
NEXTAUTH_SECRET=seu_secret_para_nextauth
NEXTAUTH_URL=https://seu-site.vercel.app
```

### 3. Deploy automático
O site será deployado automaticamente a cada push na branch `main`.

📖 **Guia completo de deploy**: Veja [DEPLOY.md](DEPLOY.md)

## 🔐 Configuração de Segurança

### Supabase RLS (Row Level Security)
O sistema usa políticas de segurança robustas:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de exemplo
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Public can read active events" ON events FOR SELECT USING (status = 'active');
CREATE POLICY "Authenticated users can insert guest lists" ON guest_lists FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## 👥 Tipos de Usuário

### 🔴 **Admin**
- Acesso completo ao sistema
- Gerenciamento de usuários, eventos e configurações
- Visualização de logs e relatórios
- Acesso a scripts de manutenção

### 🟢 **Portaria** 
- Envio de listas de nomes
- Check-in de convidados em tempo real
- Visualização de listas por evento
- Interface mobile otimizada

### 🟡 **User**
- Envio de listas de nomes
- Visualização das próprias listas
- Dashboard com estatísticas pessoais
- Histórico de atividades

### 🔘 **Público**
- Envio de nomes sem cadastro
- Seleção de eventos ativos
- Interface simplificada

## 📊 Funcionalidades Principais

### 📝 **Sistema de Listas**
- **8 tipos padrão**: VIP, Camarote, Pista, Área Externa, Staff, Imprensa, Fornecedor, Convidado
- **8 setores padrão**: Principal, VIP, Camarote, Bar, Fumódromo, Área Externa, Backstage, Staff
- Formatação automática de nomes
- Validação de dados em tempo real
- Sem limite de nomes por lista

### 📋 **Visualização Organizada**
- Agrupamento por remetente, evento e tipo
- Ordenação alfabética automática
- Interface expansível com contadores
- Filtros avançados e busca otimizada
- Paginação inteligente

### ✅ **Sistema de Check-in**
- Busca rápida com autocomplete
- Controle de entrada em tempo real
- Estatísticas de presença por evento
- Interface mobile-first
- Histórico completo de check-ins

### 📈 **Dashboard e Relatórios**
- Estatísticas em tempo real
- Gráficos de presença e atividade
- Logs detalhados de todas as ações
- Relatórios por período
- Métricas de performance

### ⚙️ **Configurações Avançadas**
- Nome do site personalizável
- Configurações de email e notificações
- Limites e validações customizáveis
- Temas e personalização visual
- Backup e restore de dados

## 🔧 Scripts de Manutenção

### Reset do Banco de Dados
```sql
-- Manter apenas usuários admin
\i scripts/99-reset-database.sql

-- Personalizar usuários a manter
\i scripts/99-reset-database-custom.sql
```

### Verificação de Integridade
```sql
-- Debug e análise
\i scripts/11-debug-event-lists.sql

-- Verificar migração
\i scripts/10-verify-migration.sql
```

## 📱 Interface Mobile

O sistema é totalmente responsivo e otimizado para dispositivos móveis, com interface touch-friendly para uso na portaria.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- 📧 Email: seu-email@exemplo.com
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/gerenciador-de-listas/issues)
- 📖 Documentação: [Wiki](https://github.com/seu-usuario/gerenciador-de-listas/wiki)

---

**🎉 Desenvolvido com ❤️ para casas de show**
