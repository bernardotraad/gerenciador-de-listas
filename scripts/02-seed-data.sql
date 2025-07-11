-- Inserir dados iniciais

-- Usuário administrador padrão
INSERT INTO users (email, name, role) VALUES 
('admin@casadeshow.com', 'Administrador', 'admin'),
('user@casadeshow.com', 'Usuário Teste', 'user')
ON CONFLICT (email) DO NOTHING;

-- Evento de exemplo
INSERT INTO events (name, description, date, time, max_capacity, created_by) 
SELECT 
  'Show de Rock - Banda XYZ',
  'Grande show de rock com a banda XYZ. Entrada gratuita mediante lista.',
  CURRENT_DATE + INTERVAL '7 days',
  '20:00:00',
  200,
  u.id
FROM users u WHERE u.role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;
