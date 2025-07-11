-- Adicionar o novo cargo "portaria" à constraint de role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user', 'portaria'));

-- Criar um usuário de exemplo para portaria (opcional)
INSERT INTO users (email, name, role) VALUES 
('portaria@casadeshow.com', 'Portaria Principal', 'portaria')
ON CONFLICT (email) DO NOTHING;

-- Log da criação do novo cargo
INSERT INTO activity_logs (action, details) VALUES 
('Sistema atualizado', 'Novo cargo "Portaria" adicionado ao sistema');
