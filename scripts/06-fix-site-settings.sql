-- Verificar se já existe o registro e atualizar se necessário
DO $$
BEGIN
  -- Verificar se o registro existe
  IF EXISTS (SELECT 1 FROM site_settings WHERE setting_key = 'site_name') THEN
    -- Se existe, apenas garantir que tem o valor padrão
    UPDATE site_settings 
    SET setting_value = 'Casa de Show', updated_at = NOW()
    WHERE setting_key = 'site_name' AND setting_value = '';
  ELSE
    -- Se não existe, inserir
    INSERT INTO site_settings (setting_key, setting_value) 
    VALUES ('site_name', 'Casa de Show');
  END IF;
END $$;
