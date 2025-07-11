-- Adicionar sistema de tipos de lista e setores

-- Criar tabela de tipos de lista
CREATE TABLE IF NOT EXISTS list_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Cor em hex para identificação visual
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir tipos de lista padrão
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

-- Criar tabela de setores
CREATE TABLE IF NOT EXISTS sectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  capacity INTEGER DEFAULT 100,
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir setores padrão
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

-- Criar tabela de listas (agrupamento de nomes)
CREATE TABLE IF NOT EXISTS event_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  list_type_id UUID REFERENCES list_types(id),
  sector_id UUID REFERENCES sectors(id),
  name VARCHAR(200) NOT NULL, -- Nome personalizado da lista
  description TEXT,
  max_capacity INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Atualizar tabela guest_lists para referenciar a lista específica
ALTER TABLE guest_lists ADD COLUMN event_list_id UUID REFERENCES event_lists(id);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_event_lists_event ON event_lists(event_id);
CREATE INDEX IF NOT EXISTS idx_event_lists_type ON event_lists(list_type_id);
CREATE INDEX IF NOT EXISTS idx_event_lists_sector ON event_lists(sector_id);
CREATE INDEX IF NOT EXISTS idx_guest_lists_event_list ON guest_lists(event_list_id);

-- Atualizar constraint para permitir guest_lists sem event_list_id (compatibilidade)
ALTER TABLE guest_lists ALTER COLUMN event_id DROP NOT NULL;
ALTER TABLE guest_lists 
ADD CONSTRAINT check_event_reference 
CHECK (
  (event_id IS NOT NULL AND event_list_id IS NULL) OR 
  (event_id IS NULL AND event_list_id IS NOT NULL)
);
