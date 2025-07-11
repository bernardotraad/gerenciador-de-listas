-- Script para verificar se a migração foi bem-sucedida

-- Verificar estrutura das tabelas
SELECT 
    'guest_lists' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN event_list_id IS NOT NULL THEN 1 END) as com_lista,
    COUNT(CASE WHEN event_id IS NOT NULL THEN 1 END) as com_evento_direto
FROM guest_lists

UNION ALL

SELECT 
    'event_lists' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN list_type_id IS NOT NULL THEN 1 END) as com_tipo,
    COUNT(CASE WHEN sector_id IS NOT NULL THEN 1 END) as com_setor
FROM event_lists;

-- Verificar listas criadas
SELECT 
    el.name as lista_nome,
    e.name as evento_nome,
    lt.name as tipo,
    s.name as setor,
    COUNT(gl.id) as total_convidados
FROM event_lists el
JOIN events e ON el.event_id = e.id
JOIN list_types lt ON el.list_type_id = lt.id
JOIN sectors s ON el.sector_id = s.id
LEFT JOIN guest_lists gl ON gl.event_list_id = el.id
GROUP BY el.id, el.name, e.name, lt.name, s.name
ORDER BY e.name, el.name;

-- Verificar se há problemas
SELECT 
    'Convidados sem lista nem evento' as problema,
    COUNT(*) as quantidade
FROM guest_lists 
WHERE event_id IS NULL AND event_list_id IS NULL

UNION ALL

SELECT 
    'Convidados com lista e evento' as problema,
    COUNT(*) as quantidade
FROM guest_lists 
WHERE event_id IS NOT NULL AND event_list_id IS NOT NULL;
