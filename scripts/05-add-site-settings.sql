-- Criar tabela de configurações do site
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir configuração padrão do nome do site
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('site_name', 'Casa de Show')
ON CONFLICT (setting_key) DO NOTHING;

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
