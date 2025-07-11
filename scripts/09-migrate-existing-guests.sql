-- Migrar convidados existentes para o sistema de listas

-- Primeiro, criar uma lista padrão "VIP" para cada evento que tem convidados
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
WHERE event_list_id IS NULL AND event_id IS NOT NULL;

-- Limpar event_id dos guest_lists que agora têm event_list_id
UPDATE guest_lists 
SET event_id = NULL 
WHERE event_list_id IS NOT NULL AND event_id IS NOT NULL;

-- Log da migração
INSERT INTO activity_logs (action, details) VALUES 
('Sistema atualizado', 'Convidados existentes migrados para o sistema de listas tipificadas');
