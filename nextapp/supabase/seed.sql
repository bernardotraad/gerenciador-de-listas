-- Seed de dados para desenvolvimento local
-- Executar DEPOIS de 001_initial_schema.sql

-- 1. Boate de teste
INSERT INTO boates (id, nome, timezone, capacidade_padrao)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Club Demo',
  'America/Sao_Paulo',
  150
);

-- 2. Evento instância de amanhã (para testar sem criar via UI)
INSERT INTO eventos_instancia (
  id, boate_id, nome,
  data_efetiva, hora_inicio, hora_fim, hora_vip_limite,
  capacidade, tipo_cliente, status
) VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Sexta VIP',
  CURRENT_DATE + INTERVAL '1 day',
  '23:00', '05:00', '00:30',
  150, 'VIP', 'Ativo'
), (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'Sábado Convidados',
  CURRENT_DATE + INTERVAL '2 days',
  '22:00', '04:00', '23:59',
  100, 'Convidado', 'Ativo'
);

-- 3. Guests de teste (adicionados manualmente, sem submissão)
INSERT INTO guest_records (evento_instancia_id, nome, tipo_cliente, source, status)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'João Silva', 'VIP', 'Manual', 'Aprovado'),
  ('00000000-0000-0000-0000-000000000010', 'Maria Santos', 'VIP', 'Manual', 'Aprovado'),
  ('00000000-0000-0000-0000-000000000010', 'Carlos Oliveira', 'VIP', 'Manual', 'Aprovado'),
  ('00000000-0000-0000-0000-000000000010', 'Ana Lima', 'Convidado', 'Manual', 'Aprovado'),
  ('00000000-0000-0000-0000-000000000010', 'Pedro Ferreira', 'VIP', 'Manual', 'Aprovado');

-- NOTA: Para criar o primeiro Admin, use POST /api/bootstrap após configurar o .env.local
