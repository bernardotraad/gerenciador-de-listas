-- Criar listas de exemplo para o evento de teste
-- Este script cria diferentes tipos de listas para demonstrar o sistema

-- Primeiro, vamos verificar se o evento existe
DO $$
DECLARE
    evento_id UUID;
    tipo_vip UUID;
    tipo_desconto UUID;
    tipo_aniversariante UUID;
    tipo_imprensa UUID;
    tipo_cortesia UUID;
    setor_pista UUID;
    setor_camarote_a UUID;
    setor_camarote_b UUID;
    setor_vip_lounge UUID;
    setor_mezanino UUID;
    admin_user UUID;
BEGIN
    -- Buscar o evento de teste
    SELECT id INTO evento_id FROM events WHERE name = 'Evento de Teste' LIMIT 1;
    
    IF evento_id IS NULL THEN
        RAISE NOTICE 'Evento de teste não encontrado. Criando...';
        
        -- Buscar um usuário admin para criar o evento
        SELECT id INTO admin_user FROM users WHERE role = 'admin' LIMIT 1;
        
        IF admin_user IS NULL THEN
            RAISE EXCEPTION 'Nenhum usuário admin encontrado para criar o evento';
        END IF;
        
        -- Criar evento de teste
        INSERT INTO events (name, description, date, time, max_capacity, status, created_by)
        VALUES (
            'Evento de Teste',
            'Evento criado para testar o sistema de listas',
            CURRENT_DATE + INTERVAL '1 day',
            '20:00',
            500,
            'active',
            admin_user
        )
        RETURNING id INTO evento_id;
        
        RAISE NOTICE 'Evento criado com ID: %', evento_id;
    ELSE
        RAISE NOTICE 'Evento encontrado com ID: %', evento_id;
    END IF;
    
    -- Buscar IDs dos tipos de lista
    SELECT id INTO tipo_vip FROM list_types WHERE name = 'VIP' LIMIT 1;
    SELECT id INTO tipo_desconto FROM list_types WHERE name = 'Desconto' LIMIT 1;
    SELECT id INTO tipo_aniversariante FROM list_types WHERE name = 'Aniversariante' LIMIT 1;
    SELECT id INTO tipo_imprensa FROM list_types WHERE name = 'Imprensa' LIMIT 1;
    SELECT id INTO tipo_cortesia FROM list_types WHERE name = 'Cortesia' LIMIT 1;
    
    -- Buscar IDs dos setores
    SELECT id INTO setor_pista FROM sectors WHERE name = 'Pista' LIMIT 1;
    SELECT id INTO setor_camarote_a FROM sectors WHERE name = 'Camarote A' LIMIT 1;
    SELECT id INTO setor_camarote_b FROM sectors WHERE name = 'Camarote B' LIMIT 1;
    SELECT id INTO setor_vip_lounge FROM sectors WHERE name = 'VIP Lounge' LIMIT 1;
    SELECT id INTO setor_mezanino FROM sectors WHERE name = 'Mezanino' LIMIT 1;
    
    -- Buscar usuário admin para criar as listas
    SELECT id INTO admin_user FROM users WHERE role = 'admin' LIMIT 1;
    
    RAISE NOTICE 'Criando listas para o evento...';
    
    -- Criar listas de exemplo (usando ON CONFLICT para evitar duplicatas)
    
    -- 1. VIP - Camarote A
    INSERT INTO event_lists (event_id, list_type_id, sector_id, name, description, max_capacity, created_by, is_active)
    VALUES (
        evento_id, tipo_vip, setor_camarote_a,
        'VIP - Camarote A',
        'Lista VIP para o Camarote A com vista privilegiada',
        50,
        admin_user,
        true
    ) ON CONFLICT DO NOTHING;
    
    -- 2. VIP - Camarote B
    INSERT INTO event_lists (event_id, list_type_id, sector_id, name, description, max_capacity, created_by, is_active)
    VALUES (
        evento_id, tipo_vip, setor_camarote_b,
        'VIP - Camarote B',
        'Lista VIP para o Camarote B com serviço exclusivo',
        40,
        admin_user,
        true
    ) ON CONFLICT DO NOTHING;
    
    -- 3. VIP - Lounge Exclusivo
    INSERT INTO event_lists (event_id, list_type_id, sector_id, name, description, max_capacity, created_by, is_active)
    VALUES (
        evento_id, tipo_vip, setor_vip_lounge,
        'VIP - Lounge Exclusivo',
        'Lista VIP para o Lounge com ambiente reservado',
        30,
        admin_user,
        true
    ) ON CONFLICT DO NOTHING;
    
    -- 4. Desconto - Pista
    INSERT INTO event_lists (event_id, list_type_id, sector_id, name, description, max_capacity, created_by, is_active)
    VALUES (
        evento_id, tipo_desconto, setor_pista,
        'Desconto - Pista',
        'Lista com desconto especial para a pista principal',
        200,
        admin_user,
        true
    ) ON CONFLICT DO NOTHING;
    
    -- 5. Aniversariantes - Pista
    INSERT INTO event_lists (event_id, list_type_id, sector_id, name, description, max_capacity, created_by, is_active)
    VALUES (
        evento_id, tipo_aniversariante, setor_pista,
        'Aniversariantes - Pista',
        'Lista especial para aniversariantes do mês',
        100,
        admin_user,
        true
    ) ON CONFLICT DO NOTHING;
    
    -- 6. Imprensa - Camarote A
    INSERT INTO event_lists (event_id, list_type_id, sector_id, name, description, max_capacity, created_by, is_active)
    VALUES (
        evento_id, tipo_imprensa, setor_camarote_a,
        'Imprensa - Camarote A',
        'Lista para profissionais da imprensa',
        20,
        admin_user,
        true
    ) ON CONFLICT DO NOTHING;
    
    -- 7. Cortesia - Mezanino
    INSERT INTO event_lists (event_id, list_type_id, sector_id, name, description, max_capacity, created_by, is_active)
    VALUES (
        evento_id, tipo_cortesia, setor_mezanino,
        'Cortesia - Mezanino',
        'Lista de cortesias para o mezanino',
        50,
        admin_user,
        true
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Listas criadas com sucesso!';
    
END $$;

-- Verificar as listas criadas
SELECT 
    el.name as lista_nome,
    e.name as evento_nome,
    lt.name as tipo_nome,
    s.name as setor_nome,
    el.max_capacity,
    el.is_active,
    el.created_at
FROM event_lists el
JOIN events e ON el.event_id = e.id
JOIN list_types lt ON el.list_type_id = lt.id
JOIN sectors s ON el.sector_id = s.id
WHERE e.name = 'Evento de Teste'
ORDER BY el.created_at DESC;
