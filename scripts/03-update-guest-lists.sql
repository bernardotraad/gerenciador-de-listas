-- Atualizar tabela de listas para remover necessidade de aprovação
-- Todos os nomes enviados ficam automaticamente disponíveis para check-in

-- Remover a constraint de status e definir como aprovado por padrão
ALTER TABLE guest_lists ALTER COLUMN status SET DEFAULT 'approved';

-- Atualizar todos os registros existentes para aprovado
UPDATE guest_lists SET status = 'approved' WHERE status = 'pending';

-- Adicionar índice para melhor performance nas consultas de check-in
CREATE INDEX IF NOT EXISTS idx_guest_lists_checked_in ON guest_lists(checked_in);
