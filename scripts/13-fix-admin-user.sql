-- Script para garantir que bernardotraad@gmail.com seja admin
-- Execute este script no Supabase SQL Editor

-- Primeiro, verificar se o usuário existe
SELECT * FROM users WHERE email = 'bernardotraad@gmail.com';

-- Se não existir, inserir o usuário
INSERT INTO users (id, email, name, role, created_at)
VALUES (
  gen_random_uuid(),
  'bernardotraad@gmail.com',
  'Bernardo Traad',
  'admin',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  name = COALESCE(EXCLUDED.name, users.name);

-- Verificar se foi atualizado
SELECT * FROM users WHERE email = 'bernardotraad@gmail.com';

-- Log da atividade
INSERT INTO activity_logs (user_id, action, details, created_at)
SELECT 
  id,
  'Usuário promovido a admin',
  'Usuário bernardotraad@gmail.com foi definido como administrador do sistema',
  NOW()
FROM users 
WHERE email = 'bernardotraad@gmail.com';
