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
- **Deploy**: Netlify com CI/CD
- **Monitoramento**: GitHub Actions

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### 1. Clone o repositório
\`\`\`bash
git clone https://github.com/seu-usuario/venue-management-system.git
cd venue-management-system
\`\`\`

### 2. Instale as dependências
\`\`\`bash
npm install
\`\`\`

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
\`\`\`

### 4. Configure o banco de dados
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

### 5. Execute o projeto
\`\`\`bash
npm run dev
\`\`\`

Acesse `http://localhost:3000`

### 6. Primeiro acesso
- **Login padrão**: `admin@admin.com` / `admin123`
- Configure o nome do site em Configurações
- Crie seu primeiro evento
- Adicione tipos de lista e setores conforme necessário

## 📦 Deploy no Netlify

### 1. Conecte seu repositório
- Faça login no [Netlify](https://netlify.com)
- Clique em "New site from Git"
- Conecte seu repositório GitHub

### 2. Configure as variáveis de ambiente
No painel do Netlify, vá em Site settings > Environment variables:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
\`\`\`

### 3. Configure o build
- Build command: `npm run build`
- Publish directory: `.next`
- Node version: `18`

### 4. Deploy automático
O site será deployado automaticamente a cada push na branch `main` via GitHub Actions.

## 🔐 Configuração de Segurança

### Supabase RLS (Row Level Security)
O sistema usa políticas de segurança robustas:

\`\`\`sql
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
\`\`\`

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
\`\`\`sql
-- Manter apenas usuários admin
\i scripts/99-reset-database.sql

-- Personalizar usuários a manter
\i scripts/99-reset-database-custom.sql
\`\`\`

### Verificação de Integridade
\`\`\`sql
-- Debug e análise
\i scripts/11-debug-event-lists.sql

-- Verificar migração
\i scripts/10-verify-migration.sql
\`\`\`

## 📱 Interface Mobile

- **Design mobile-first** otimizado para portaria
- **Menu simplificado** com navegação intuitiva
- **Botões grandes** para facilitar uso em movimento
- **Cards responsivos** que se adaptam a qualquer tela
- **Busca otimizada** com resultados instantâneos

## 🎯 Roadmap

### 🚧 **Em Desenvolvimento**
- [ ] Notificações push em tempo real
- [ ] Relatórios avançados com gráficos
- [ ] App mobile nativo
- [ ] Integração com sistemas de pagamento
- [ ] API pública para integrações

### 💡 **Planejado**
- [ ] Sistema de convites por QR Code
- [ ] Integração com redes sociais
- [ ] Análise de dados com IA
- [ ] Multi-idioma
- [ ] Tema escuro avançado

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### 📋 **Guidelines**
- Use TypeScript para type safety
- Siga os padrões do ESLint e Prettier
- Adicione testes para novas funcionalidades
- Documente mudanças no README
- Use commits semânticos

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

Para suporte técnico:
- 📧 Email: suporte@casadeshow.com
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/venue-management-system/issues)
- 📖 Documentação: [Wiki do Projeto](https://github.com/seu-usuario/venue-management-system/wiki)

## 🏆 Créditos

Desenvolvido com ❤️ para facilitar o gerenciamento de eventos e melhorar a experiência de todos os envolvidos.

### 🛠️ **Stack Tecnológico**
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Supabase, PostgreSQL
- **Deploy**: Netlify, GitHub Actions
- **UI**: shadcn/ui, Lucide Icons
- **Monitoramento**: Supabase Analytics

---

**Sistema de Gerenciamento de Listas v2.0** - Transformando a gestão de eventos! 🎉
