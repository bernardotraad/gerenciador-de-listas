-- Debug: Verificar todas as listas de eventos e seus relacionamentos
SELECT 
  'LISTAS DE EVENTOS' as tipo,
  json_agg(
    json_build_object(
      'id', el.id,
      'lista_nome', el.name,
      'event_id', el.event_id,
      'evento_nome', e.name,
      'tipo_nome', lt.name,
      'tipo_cor', lt.color,
      'setor_nome', s.name,
      'setor_cor', s.color,
      'is_active', el.is_active,
      'created_at', el.created_at
    )
  ) as dados
FROM event_lists el
LEFT JOIN events e ON el.event_id = e.id
LEFT JOIN list_types lt ON el.list_type_id = lt.id
LEFT JOIN sectors s ON el.sector_id = s.id;

-- Debug: Verificar todos os tipos de lista
SELECT 
  'TIPOS DE LISTA' as tipo,
  json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'color', color,
      'is_active', is_active
    )
  ) as dados
FROM list_types 
WHERE is_active = true;

-- Debug: Verificar todos os setores
SELECT 
  'SETORES' as tipo,
  json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'color', color,
      'is_active', is_active
    )
  ) as dados
FROM sectors 
WHERE is_active = true;

-- Debug: Verificar eventos ativos
SELECT 
  'EVENTOS' as tipo,
  json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'date', date,
      'status', status
    )
  ) as dados
FROM events 
WHERE status = 'active';
