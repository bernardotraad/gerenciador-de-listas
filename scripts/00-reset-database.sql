-- =====================================================
-- SCRIPT DE RESET COMPLETO DA DATABASE
-- Gerenciador de Listas - Supabase
-- =====================================================
-- ATENÇÃO: Este script irá APAGAR TODOS os dados existentes!
-- Use apenas se quiser começar do zero

-- =====================================================
-- 1. DESABILITAR RLS TEMPORARIAMENTE
-- =====================================================

ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS list_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sectors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS event_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS guest_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS site_settings DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. REMOVER TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_event_list_count ON guest_lists;
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
DROP TRIGGER IF EXISTS trigger_update_events_updated_at ON events;
DROP TRIGGER IF EXISTS trigger_update_event_lists_updated_at ON event_lists;

-- =====================================================
-- 3. REMOVER FUNÇÕES
-- =====================================================

DROP FUNCTION IF EXISTS update_event_list_count();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- =====================================================
-- 4. REMOVER POLÍTICAS RLS
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view active events" ON events;
DROP POLICY IF EXISTS "Admins can manage all events" ON events;
DROP POLICY IF EXISTS "Public can insert guest lists" ON guest_lists;
DROP POLICY IF EXISTS "Admins can view all guest lists" ON guest_lists;
DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;

-- =====================================================
-- 5. REMOVER ÍNDICES
-- =====================================================

-- Índices de eventos
DROP INDEX IF EXISTS idx_events_date;
DROP INDEX IF EXISTS idx_events_status;
DROP INDEX IF EXISTS idx_events_created_by;

-- Índices de listas de eventos
DROP INDEX IF EXISTS idx_event_lists_event;
DROP INDEX IF EXISTS idx_event_lists_type;
DROP INDEX IF EXISTS idx_event_lists_sector;
DROP INDEX IF EXISTS idx_event_lists_active;

-- Índices de listas de convidados
DROP INDEX IF EXISTS idx_guest_lists_event;
DROP INDEX IF EXISTS idx_guest_lists_event_list;
DROP INDEX IF EXISTS idx_guest_lists_checked_in;
DROP INDEX IF EXISTS idx_guest_lists_submitted_by;
DROP INDEX IF EXISTS idx_guest_lists_sender_email;

-- Índices de logs
DROP INDEX IF EXISTS idx_activity_logs_user;
DROP INDEX IF EXISTS idx_activity_logs_event;
DROP INDEX IF EXISTS idx_activity_logs_created_at;

-- Índices de configurações
DROP INDEX IF EXISTS idx_site_settings_key;

-- =====================================================
-- 6. REMOVER CONSTRAINTS
-- =====================================================

-- Remover constraints das tabelas
ALTER TABLE IF EXISTS guest_lists DROP CONSTRAINT IF EXISTS check_event_reference;
ALTER TABLE IF EXISTS guest_lists DROP CONSTRAINT IF EXISTS check_sender;
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_role_check;

-- =====================================================
-- 7. REMOVER TABELAS (EM ORDEM DE DEPENDÊNCIA)
-- =====================================================

-- Remover tabelas que dependem de outras
DROP TABLE IF EXISTS guest_lists CASCADE;
DROP TABLE IF EXISTS event_lists CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;

-- Remover tabelas principais
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS list_types CASCADE;
DROP TABLE IF EXISTS sectors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 8. LIMPAR SEQUÊNCIAS (SE EXISTIREM)
-- =====================================================

-- Resetar sequências se existirem
DO $$
DECLARE
    seq_name text;
BEGIN
    FOR seq_name IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || seq_name || ' CASCADE';
    END LOOP;
END $$;

-- =====================================================
-- 9. MENSAGEM DE CONFIRMAÇÃO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'RESET COMPLETO REALIZADO!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Todas as tabelas, dados, funções e configurações foram removidas.';
    RAISE NOTICE '';
    RAISE NOTICE 'Para recriar a database, execute o script:';
    RAISE NOTICE '00-setup-database-complete.sql';
    RAISE NOTICE '=====================================================';
END $$; 