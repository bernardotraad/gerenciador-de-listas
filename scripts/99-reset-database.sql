-- Script para resetar o banco de dados mantendo usuários admin
-- Este script deleta todos os dados mas preserva usuários com role 'admin'

BEGIN;

-- Desabilitar verificações de foreign key temporariamente
SET session_replication_role = replica;

-- Deletar dados das tabelas (ordem importante por causa das foreign keys)
DELETE FROM check_ins;
DELETE FROM guest_list_entries;
DELETE FROM guest_lists WHERE id NOT IN (SELECT DISTINCT guest_list_id FROM guest_list_entries WHERE guest_list_id IS NOT NULL);
DELETE FROM events;
DELETE FROM activity_logs;

-- Deletar usuários que não são admin
DELETE FROM users WHERE role != 'admin';

-- Reabilitar verificações de foreign key
SET session_replication_role = DEFAULT;

-- Inserir dados básicos necessários

-- Inserir tipos de lista se não existirem
INSERT INTO list_types (name, description, color, icon, created_at, updated_at) VALUES
('VIP', 'Lista de convidados VIP com acesso prioritário', '#FFD700', 'crown', NOW(), NOW()),
('Geral', 'Lista geral de convidados', '#3B82F6', 'users', NOW(), NOW()),
('Staff', 'Equipe e funcionários do evento', '#10B981', 'briefcase', NOW(), NOW()),
('Imprensa', 'Jornalistas e profissionais de mídia', '#8B5CF6', 'camera', NOW(), NOW()),
('Fornecedores', 'Fornecedores e prestadores de serviço', '#F59E0B', 'truck', NOW(), NOW()),
('Artistas', 'Artistas e performers', '#EF4444', 'music', NOW(), NOW()),
('Convidados Especiais', 'Convidados especiais e autoridades', '#EC4899', 'star', NOW(), NOW()),
('Produção', 'Equipe de produção do evento', '#6B7280', 'clapperboard', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Inserir setores se não existirem
INSERT INTO sectors (name, description, capacity, color, created_at, updated_at) VALUES
('Pista', 'Área principal do evento', 1000, '#3B82F6', NOW(), NOW()),
('Camarote A', 'Camarote premium lado direito', 100, '#FFD700', NOW(), NOW()),
('Camarote B', 'Camarote premium lado esquerdo', 100, '#FFD700', NOW(), NOW()),
('VIP Lounge', 'Área VIP exclusiva', 50, '#8B5CF6', NOW(), NOW()),
('Backstage', 'Área restrita para artistas e staff', 30, '#EF4444', NOW(), NOW()),
('Imprensa', 'Área destinada à imprensa', 20, '#10B981', NOW(), NOW()),
('Bar Premium', 'Área do bar premium', 80, '#F59E0B', NOW(), NOW()),
('Mezanino', 'Área elevada com vista panorâmica', 200, '#EC4899', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Inserir configurações básicas do site
INSERT INTO site_settings (key, value, description, created_at, updated_at) VALUES
('site_name', 'Sistema de Gestão de Eventos', 'Nome do site exibido na interface', NOW(), NOW()),
('site_description', 'Gerencie eventos, listas de convidados e check-ins de forma eficiente', 'Descrição do site', NOW(), NOW()),
('contact_email', 'contato@eventos.com', 'Email de contato principal', NOW(), NOW()),
('contact_phone', '(11) 99999-9999', 'Telefone de contato', NOW(), NOW()),
('max_guests_per_submission', '100', 'Máximo de convidados por envio', NOW(), NOW()),
('enable_public_submissions', 'true', 'Permitir envios públicos de listas', NOW(), NOW()),
('default_event_capacity', '500', 'Capacidade padrão para novos eventos', NOW(), NOW()),
('check_in_window_hours', '24', 'Janela de tempo para check-in (horas)', NOW(), NOW()),
('notification_email', 'notificacoes@eventos.com', 'Email para notificações do sistema', NOW(), NOW()),
('backup_frequency_hours', '24', 'Frequência de backup em horas', NOW(), NOW()),
('session_timeout_minutes', '60', 'Timeout da sessão em minutos', NOW(), NOW()),
('theme_color', '#3B82F6', 'Cor principal do tema', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Registrar a operação de reset nos logs
INSERT INTO activity_logs (user_id, action, details, ip_address, created_at)
SELECT 
    id,
    'database_reset',
    'Banco de dados resetado - dados básicos inseridos',
    '127.0.0.1',
    NOW()
FROM users 
WHERE role = 'admin' 
LIMIT 1;

-- Mostrar estatísticas finais
SELECT 
    'Usuários mantidos' as categoria,
    COUNT(*) as quantidade
FROM users
WHERE role = 'admin'

UNION ALL

SELECT 
    'Tipos de lista inseridos' as categoria,
    COUNT(*) as quantidade
FROM list_types

UNION ALL

SELECT 
    'Setores inseridos' as categoria,
    COUNT(*) as quantidade
FROM sectors

UNION ALL

SELECT 
    'Configurações inseridas' as categoria,
    COUNT(*) as quantidade
FROM site_settings;

COMMIT;

-- Mensagem final
SELECT 'Reset do banco de dados concluído com sucesso! Usuários admin mantidos e dados básicos inseridos.' as status;
