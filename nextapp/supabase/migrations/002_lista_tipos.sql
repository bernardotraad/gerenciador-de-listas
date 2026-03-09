-- ============================================================
-- Migration 002: Tipos de Lista por Evento (Multi-Lista)
-- Remove tipo_cliente fixo; introduz lista_tipos global por boate
-- ============================================================

-- ── 1. Tabela lista_tipos ─────────────────────────────────────

CREATE TABLE lista_tipos (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  boate_id   UUID         NOT NULL REFERENCES boates(id) ON DELETE CASCADE,
  nome       VARCHAR(100) NOT NULL,
  ativo      BOOLEAN      NOT NULL DEFAULT TRUE,
  ordem      INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE lista_tipos ENABLE ROW LEVEL SECURITY;

-- Leitura pública (form de submit precisa listar tipos sem auth)
CREATE POLICY "lista_tipos_read" ON lista_tipos
  FOR SELECT USING (true);

-- Escrita apenas para usuários autenticados
CREATE POLICY "lista_tipos_write" ON lista_tipos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX idx_lista_tipos_boate ON lista_tipos(boate_id, ativo);

-- ── 2. Tabela evento_lista_tipos (junction instancia ↔ tipo) ──

CREATE TABLE evento_lista_tipos (
  evento_instancia_id UUID NOT NULL REFERENCES eventos_instancia(id) ON DELETE CASCADE,
  lista_tipo_id       UUID NOT NULL REFERENCES lista_tipos(id) ON DELETE CASCADE,
  PRIMARY KEY (evento_instancia_id, lista_tipo_id)
);

ALTER TABLE evento_lista_tipos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "elt_read" ON evento_lista_tipos
  FOR SELECT USING (true);

CREATE POLICY "elt_write" ON evento_lista_tipos
  FOR ALL USING (auth.role() = 'authenticated');

-- ── 3. Adicionar lista_tipo_id em guest_submissions ───────────

ALTER TABLE guest_submissions
  ADD COLUMN lista_tipo_id UUID REFERENCES lista_tipos(id);

-- ── 4. Atualizar guest_records ────────────────────────────────

ALTER TABLE guest_records
  ADD COLUMN lista_tipo_id UUID REFERENCES lista_tipos(id);

ALTER TABLE guest_records
  DROP COLUMN tipo_cliente;

-- ── 5. Atualizar check_in_records ─────────────────────────────

ALTER TABLE check_in_records
  ADD COLUMN lista_tipo_nome VARCHAR(100);

ALTER TABLE check_in_records
  DROP COLUMN tipo_cliente;

-- ── 6. Remover tipo_cliente dos eventos ───────────────────────

ALTER TABLE eventos_instancia DROP COLUMN tipo_cliente;
ALTER TABLE eventos_template  DROP COLUMN tipo_cliente;

-- Dropar enums que não são mais usados
DROP TYPE IF EXISTS evento_tipo;
DROP TYPE IF EXISTS guest_tipo;

-- ── 7. Seed de tipos padrão para a boate existente ────────────

INSERT INTO lista_tipos (boate_id, nome, ordem)
SELECT id, 'Lista VIP', 1 FROM boates LIMIT 1;

INSERT INTO lista_tipos (boate_id, nome, ordem)
SELECT id, 'Lista Amiga', 2 FROM boates LIMIT 1;
