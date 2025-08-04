-- =====================================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO DA DATABASE
-- Gerenciador de Listas - Supabase
-- =====================================================
-- Este script cria toda a estrutura da database do zero
-- Execute este script no SQL Editor do Supabase para configurar o sistema

-- =====================================================
-- 1. CRIAR TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'portaria')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de eventos
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  location VARCHAR(255),
  max_capacity INTEGER DEFAULT 100,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de tipos de lista
CREATE TABLE IF NOT EXISTS list_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de setores
CREATE TABLE IF NOT EXISTS sectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  capacity INTEGER DEFAULT 100,
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de listas de eventos
CREATE TABLE IF NOT EXISTS event_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  list_type_id UUID REFERENCES list_types(id),
  sector_id UUID REFERENCES sectors(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  max_capacity INTEGER,
  current_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de listas de convidados
CREATE TABLE IF NOT EXISTS guest_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  event_list_id UUID REFERENCES event_lists(id) ON DELETE CASCADE,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP,
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  sender_name VARCHAR(255),
  sender_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de logs de atividade
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  action VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de configurações do site
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para eventos
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Índices para listas de eventos
CREATE INDEX IF NOT EXISTS idx_event_lists_event ON event_lists(event_id);
CREATE INDEX IF NOT EXISTS idx_event_lists_type ON event_lists(list_type_id);
CREATE INDEX IF NOT EXISTS idx_event_lists_sector ON event_lists(sector_id);
CREATE INDEX IF NOT EXISTS idx_event_lists_active ON event_lists(is_active);

-- Índices para listas de convidados
CREATE INDEX IF NOT EXISTS idx_guest_lists_event ON guest_lists(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_lists_event_list ON guest_lists(event_list_id);
CREATE INDEX IF NOT EXISTS idx_guest_lists_checked_in ON guest_lists(checked_in);
CREATE INDEX IF NOT EXISTS idx_guest_lists_submitted_by ON guest_lists(submitted_by);
CREATE INDEX IF NOT EXISTS idx_guest_lists_sender_email ON guest_lists(sender_email);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event ON activity_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Índices para configurações
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

-- =====================================================
-- 3. ADICIONAR CONSTRAINTS E RELACIONAMENTOS
-- =====================================================

-- Constraint para garantir que guest_lists tenha pelo menos uma referência
ALTER TABLE guest_lists 
ADD CONSTRAINT check_event_reference 
CHECK (
  (event_id IS NOT NULL AND event_list_id IS NULL) OR 
  (event_id IS NULL AND event_list_id IS NOT NULL)
);

-- Constraint para garantir que pelo menos um tipo de remetente seja informado
ALTER TABLE guest_lists 
ADD CONSTRAINT check_sender 
CHECK (
  (submitted_by IS NOT NULL) OR 
  (sender_name IS NOT NULL AND sender_email IS NOT NULL)
);

-- =====================================================
-- 4. INSERIR DADOS INICIAIS
-- =====================================================

-- Usuários padrão
INSERT INTO users (email, name, role) VALUES 
('admin@casadeshow.com', 'Administrador', 'admin'),
('user@casadeshow.com', 'Usuário Teste', 'user'),
('portaria@casadeshow.com', 'Portaria Principal', 'portaria')
ON CONFLICT (email) DO NOTHING;

-- Tipos de lista padrão
INSERT INTO list_types (name, description, color) VALUES 
('VIP', 'Lista VIP com acesso premium', '#FFD700'),
('Desconto', 'Lista com desconto especial', '#10B981'),
('Aniversariante', 'Lista para aniversariantes do mês', '#F59E0B'),
('Imprensa', 'Lista para profissionais da imprensa', '#8B5CF6'),
('Artista', 'Lista de convidados do artista', '#EF4444'),
('Produção', 'Lista da equipe de produção', '#6B7280'),
('Cortesia', 'Lista de cortesias da casa', '#06B6D4'),
('Camarote', 'Lista para área de camarote', '#EC4899')
ON CONFLICT DO NOTHING;

-- Setores padrão
INSERT INTO sectors (name, description, capacity, color) VALUES 
('Pista', 'Área principal da pista de dança', 500, '#3B82F6'),
('Camarote A', 'Camarote superior lado direito', 50, '#F59E0B'),
('Camarote B', 'Camarote superior lado esquerdo', 50, '#10B981'),
('VIP Lounge', 'Área VIP exclusiva', 30, '#FFD700'),
('Backstage', 'Área dos bastidores', 20, '#EF4444'),
('Bar Premium', 'Área do bar premium', 40, '#8B5CF6'),
('Mezanino', 'Área do mezanino', 100, '#06B6D4'),
('Área Externa', 'Terraço e área externa', 80, '#EC4899')
ON CONFLICT DO NOTHING;

-- Configurações do site
INSERT INTO site_settings (setting_key, setting_value) VALUES 
('site_name', 'Casa de Show'),
('site_description', 'Sistema de Gerenciamento de Listas'),
('max_guests_per_submission', '50'),
('allow_public_submissions', 'true'),
('require_email_confirmation', 'false')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- 5. CRIAR EVENTO E LISTAS DE EXEMPLO
-- =====================================================

-- Criar evento de exemplo
DO $$
DECLARE
    evento_id UUID;
    admin_user UUID;
    tipo_vip UUID;
    tipo_desconto UUID;
    tipo_cortesia UUID;
    setor_pista UUID;
    setor_camarote_a UUID;
    setor_vip_lounge UUID;
BEGIN
    -- Buscar usuário admin
    SELECT id INTO admin_user FROM users WHERE role = 'admin' LIMIT 1;
    
    -- Criar evento de exemplo
    INSERT INTO events (name, description, date, time, location, max_capacity, status, created_by)
    VALUES (
        'Show de Rock - Banda XYZ',
        'Grande show de rock com a banda XYZ. Entrada gratuita mediante lista.',
        CURRENT_DATE + INTERVAL '7 days',
        '20:00:00',
        'Casa de Show Principal',
        500,
        'active',
        admin_user
    )
    RETURNING id INTO evento_id;
    
    -- Buscar tipos de lista
    SELECT id INTO tipo_vip FROM list_types WHERE name = 'VIP' LIMIT 1;
    SELECT id INTO tipo_desconto FROM list_types WHERE name = 'Desconto' LIMIT 1;
    SELECT id INTO tipo_cortesia FROM list_types WHERE name = 'Cortesia' LIMIT 1;
    
    -- Buscar setores
    SELECT id INTO setor_pista FROM sectors WHERE name = 'Pista' LIMIT 1;
    SELECT id INTO setor_camarote_a FROM sectors WHERE name = 'Camarote A' LIMIT 1;
    SELECT id INTO setor_vip_lounge FROM sectors WHERE name = 'VIP Lounge' LIMIT 1;
    
    -- Criar listas de exemplo
    INSERT INTO event_lists (event_id, list_type_id, sector_id, name, description, max_capacity, created_by, is_active)
    VALUES 
        (evento_id, tipo_vip, setor_camarote_a, 'VIP - Camarote A', 'Lista VIP para o Camarote A', 50, admin_user, true),
        (evento_id, tipo_desconto, setor_pista, 'Desconto - Pista', 'Lista com desconto para a pista', 100, admin_user, true),
        (evento_id, tipo_cortesia, setor_vip_lounge, 'Cortesia - VIP Lounge', 'Lista de cortesias para o VIP Lounge', 30, admin_user, true);
    
    -- Log da criação
    INSERT INTO activity_logs (user_id, event_id, action, details)
    VALUES (admin_user, evento_id, 'Evento criado', 'Evento de exemplo criado automaticamente');
    
    RAISE NOTICE 'Evento de exemplo criado com ID: %', evento_id;
END $$;

-- =====================================================
-- 6. CRIAR FUNÇÕES ÚTEIS
-- =====================================================

-- Função para atualizar o contador de convidados em uma lista
CREATE OR REPLACE FUNCTION update_event_list_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE event_lists 
        SET current_count = current_count + 1
        WHERE id = NEW.event_list_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE event_lists 
        SET current_count = current_count - 1
        WHERE id = OLD.event_list_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador automaticamente
DROP TRIGGER IF EXISTS trigger_update_event_list_count ON guest_lists;
CREATE TRIGGER trigger_update_event_list_count
    AFTER INSERT OR DELETE ON guest_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_event_list_count();

-- Função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_events_updated_at ON events;
CREATE TRIGGER trigger_update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_event_lists_updated_at ON event_lists;
CREATE TRIGGER trigger_update_event_lists_updated_at
    BEFORE UPDATE ON event_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários (apenas admins podem ver todos)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Políticas para eventos (todos podem ver eventos ativos)
CREATE POLICY "Anyone can view active events" ON events
    FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage all events" ON events
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para listas de convidados (público pode inserir, admins podem ver tudo)
CREATE POLICY "Public can insert guest lists" ON guest_lists
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all guest lists" ON guest_lists
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para configurações (apenas admins)
CREATE POLICY "Admins can manage site settings" ON site_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- 8. MENSAGEM DE CONFIRMAÇÃO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'CONFIGURAÇÃO COMPLETA!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Database configurada com sucesso!';
    RAISE NOTICE '';
    RAISE NOTICE 'Usuários criados:';
    RAISE NOTICE '- admin@casadeshow.com (admin)';
    RAISE NOTICE '- user@casadeshow.com (user)';
    RAISE NOTICE '- portaria@casadeshow.com (portaria)';
    RAISE NOTICE '';
    RAISE NOTICE 'Evento de exemplo criado: "Show de Rock - Banda XYZ"';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Configure as variáveis de ambiente no seu projeto';
    RAISE NOTICE '2. Configure o Supabase Auth se necessário';
    RAISE NOTICE '3. Teste o sistema com os dados de exemplo';
    RAISE NOTICE '=====================================================';
END $$; 