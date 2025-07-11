-- Adicionar campos para permitir envios de usuários não cadastrados

-- Adicionar campos para dados do remetente não cadastrado
ALTER TABLE guest_lists 
ADD COLUMN sender_name VARCHAR(255),
ADD COLUMN sender_email VARCHAR(255);

-- Tornar submitted_by opcional (para envios públicos)
ALTER TABLE guest_lists ALTER COLUMN submitted_by DROP NOT NULL;

-- Adicionar constraint para garantir que pelo menos um tipo de remetente seja informado
ALTER TABLE guest_lists 
ADD CONSTRAINT check_sender 
CHECK (
  (submitted_by IS NOT NULL) OR 
  (sender_name IS NOT NULL AND sender_email IS NOT NULL)
);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_guest_lists_sender_email ON guest_lists(sender_email);
