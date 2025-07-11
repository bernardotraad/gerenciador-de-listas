-- Migrar convidados existentes para o sistema de listas (CORRIGIDO)

-- Primeiro, remover a constraint problemática temporariamente
ALTER TABLE guest_lists DROP CONSTRAINT IF EXISTS check_event_reference;

-- Criar uma lista padrão "VIP" para cada evento que tem convidados
INSERT INTO event_lists (event_id, list_type_id, sector_id, name, description, created_by)
SELECT DISTINCT 
  gl.event_id,
  lt.id as list_type_id,
  s.id as sector_id,
  CONCAT('VIP - ', e.name) as name,
  'Lista VIP criada automaticamente para convidados existentes' as description,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by
FROM guest_lists gl
JOIN events e ON gl.event_id = e.id
CROSS JOIN list_types lt
CROSS JOIN sectors s
WHERE gl.event_list_id IS NULL
  AND gl.event_id IS NOT NULL
  AND lt.name = 'VIP'
  AND s.name = 'Pista'
  AND NOT EXISTS (
    SELECT 1 FROM event_lists el 
    WHERE el.event_id = gl.event_id 
    AND el.list_type_id = lt.id
  );

-- Atualizar todos os convidados existentes para referenciar a lista VIP criada
UPDATE guest_lists 
SET event_list_id = (
  SELECT el.id 
  FROM event_lists el
  JOIN list_types lt ON el.list_type_id = lt.id
  WHERE el.event_id = guest_lists.event_id 
  AND lt.name = 'VIP'
  LIMIT 1
)
WHERE event_list_id IS NULL 
  AND event_id IS NOT NULL;

-- Limpar event_id dos guest_lists que agora têm event_list_id
UPDATE guest_lists 
SET event_id = NULL 
WHERE event_list_id IS NOT NULL;

-- Recriar a constraint corrigida
ALTER TABLE guest_lists 
ADD CONSTRAINT check_event_reference 
CHECK (
  (event_id IS NOT NULL AND event_list_id IS NULL) OR 
  (event_id IS NULL AND event_list_id IS NOT NULL)
);

-- Verificar se há registros órfãos e corrigi-los
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    -- Contar registros órfãos
    SELECT COUNT(*) INTO orphan_count
    FROM guest_lists 
    WHERE event_id IS NULL AND event_list_id IS NULL;
    
    IF orphan_count > 0 THEN
        -- Se houver órfãos, deletá-los ou corrigi-los
        RAISE NOTICE 'Encontrados % registros órfãos. Removendo...', orphan_count;
        DELETE FROM guest_lists WHERE event_id IS NULL AND event_list_id IS NULL;
    END IF;
END $$;

-- Log da migração
INSERT INTO activity_logs (action, details) VALUES 
('Sistema atualizado', 'Convidados existentes migrados para o sistema de listas tipificadas');

-- Verificar resultado da migração
DO $$
DECLARE
    total_guests INTEGER;
    migrated_guests INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_guests FROM guest_lists;
    SELECT COUNT(*) INTO migrated_guests FROM guest_lists WHERE event_list_id IS NOT NULL;
    
    RAISE NOTICE 'Migração concluída: % de % convidados migrados para listas tipificadas', migrated_guests, total_guests;
END $$;
