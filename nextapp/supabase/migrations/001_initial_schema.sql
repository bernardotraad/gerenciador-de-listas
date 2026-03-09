-- ============================================================
-- VIP List Manager — Schema SQL Completo
-- Executar no SQL Editor do Supabase (em ordem)
-- ============================================================

-- ── ENUMs ────────────────────────────────────────────────────

CREATE TYPE user_role         AS ENUM ('Admin', 'Portaria', 'Viewer');
CREATE TYPE user_status       AS ENUM ('Ativo', 'Inativo');
CREATE TYPE evento_tipo       AS ENUM ('VIP', 'Convidado', 'Misto');
CREATE TYPE evento_status     AS ENUM ('Ativo', 'Inativo', 'Cancelado');
CREATE TYPE instancia_status  AS ENUM ('Ativo', 'Cancelado', 'Finalizado');
CREATE TYPE submission_status AS ENUM ('Rascunho', 'Pendente', 'Aprovado', 'Rejeitado');
CREATE TYPE guest_tipo        AS ENUM ('VIP', 'Convidado');
CREATE TYPE guest_source      AS ENUM ('Manual', 'Import', 'Submission');
CREATE TYPE guest_status      AS ENUM ('Pendente', 'Aprovado', 'Rejeitado', 'Presente');
CREATE TYPE checkin_status    AS ENUM ('Presente', 'Saida');

-- ── 1. boates ────────────────────────────────────────────────

CREATE TABLE boates (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome              VARCHAR(255) NOT NULL,
  timezone          VARCHAR(50)  NOT NULL DEFAULT 'America/Sao_Paulo',
  capacidade_padrao INT          NOT NULL DEFAULT 100 CHECK (capacidade_padrao > 0),
  ativo             BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boates_ativo ON boates(ativo);

-- ── 2. users ─────────────────────────────────────────────────
-- Vinculada ao auth.users do Supabase via trigger

CREATE TABLE users (
  id         UUID        PRIMARY KEY, -- mesmo id do auth.users
  boate_id   UUID        REFERENCES boates(id) ON DELETE SET NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  nome       VARCHAR(255) NOT NULL,
  role       user_role    NOT NULL DEFAULT 'Viewer',
  status     user_status  NOT NULL DEFAULT 'Ativo',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_boate_role ON users(boate_id, role);
CREATE INDEX idx_users_email      ON users(email);

-- Sync automático: cria registro em users quando novo auth.user é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 3. eventos_template ──────────────────────────────────────

CREATE TABLE eventos_template (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  boate_id         UUID         NOT NULL REFERENCES boates(id) ON DELETE CASCADE,
  admin_id         UUID         REFERENCES users(id) ON DELETE SET NULL,
  nome             VARCHAR(255)  NOT NULL,
  descricao        TEXT,
  data_referencia  DATE          NOT NULL,
  hora_inicio      TIME          NOT NULL,
  hora_fim         TIME          NOT NULL,
  -- NOTA: hora_fim pode ser < hora_inicio (eventos noturnos que cruzam meia-noite)
  -- Não usar CHECK (hora_fim > hora_inicio)
  hora_vip_limite  TIME          NOT NULL,
  capacidade       INT           NOT NULL CHECK (capacidade > 0),
  tipo_cliente     evento_tipo   NOT NULL DEFAULT 'VIP',
  status           evento_status NOT NULL DEFAULT 'Ativo',
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_template_boate UNIQUE (boate_id, data_referencia, hora_inicio)
);

CREATE INDEX idx_eventos_template_boate  ON eventos_template(boate_id, status);
CREATE INDEX idx_eventos_template_data   ON eventos_template(data_referencia);

-- ── 4. eventos_instancia ─────────────────────────────────────

CREATE TABLE eventos_instancia (
  id              UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID             REFERENCES eventos_template(id) ON DELETE SET NULL,
  boate_id        UUID             NOT NULL REFERENCES boates(id) ON DELETE CASCADE,
  nome            VARCHAR(255)      NOT NULL,
  data_efetiva    DATE              NOT NULL, -- Dia de início (antes da meia-noite)
  hora_inicio     TIME              NOT NULL,
  hora_fim        TIME              NOT NULL,
  -- NOTA: hora_fim pode ser < hora_inicio — ver RN-010
  hora_vip_limite TIME              NOT NULL,
  capacidade      INT               NOT NULL CHECK (capacidade > 0),
  tipo_cliente    evento_tipo       NOT NULL DEFAULT 'VIP',
  semana_numero   INT               CHECK (semana_numero > 0),
  status          instancia_status  NOT NULL DEFAULT 'Ativo',
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_instancia_boate UNIQUE (boate_id, data_efetiva, hora_inicio)
);

CREATE INDEX idx_instancia_template      ON eventos_instancia(template_id);
CREATE INDEX idx_instancia_data          ON eventos_instancia(data_efetiva);
CREATE INDEX idx_instancia_status        ON eventos_instancia(status);
CREATE INDEX idx_instancia_boate_data    ON eventos_instancia(boate_id, data_efetiva);
-- Índice para buscar eventos ativos que cruzam meia-noite
CREATE INDEX idx_instancia_ativo_data    ON eventos_instancia(boate_id, data_efetiva) WHERE status = 'Ativo';

-- ── 5. guest_submissions ─────────────────────────────────────

CREATE TABLE guest_submissions (
  id                   UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_instancia_id  UUID              NOT NULL REFERENCES eventos_instancia(id) ON DELETE CASCADE,
  raw_text             TEXT              NOT NULL,
  parsed_names         JSONB             NOT NULL DEFAULT '[]'::jsonb,
  submitter_label      VARCHAR(255),     -- Ex: "Pedro Promoter" (para difernciar homônimos na portaria)
  submission_ip        INET,
  status               submission_status NOT NULL DEFAULT 'Pendente',
  approval_notes       TEXT,
  approved_by          UUID              REFERENCES users(id) ON DELETE SET NULL,
  approved_at          TIMESTAMPTZ,
  expires_at           TIMESTAMPTZ       NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at           TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT check_approval CHECK (
    (status = 'Aprovado' AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR
    (status != 'Aprovado')
  )
);

CREATE INDEX idx_submissions_evento   ON guest_submissions(evento_instancia_id);
CREATE INDEX idx_submissions_status   ON guest_submissions(status);
CREATE INDEX idx_submissions_expires  ON guest_submissions(expires_at) WHERE status = 'Pendente';

-- ── 6. guest_records ─────────────────────────────────────────

CREATE TABLE guest_records (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_instancia_id UUID         NOT NULL REFERENCES eventos_instancia(id) ON DELETE CASCADE,
  submission_id       UUID         REFERENCES guest_submissions(id) ON DELETE SET NULL,
  nome                VARCHAR(255) NOT NULL,
  tipo_cliente        guest_tipo   NOT NULL DEFAULT 'VIP',
  source              guest_source NOT NULL DEFAULT 'Manual',
  status              guest_status NOT NULL DEFAULT 'Aprovado',
  added_by            UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- LOWER() em UNIQUE exige CREATE UNIQUE INDEX (não funciona como CONSTRAINT inline)
-- Permite homônimos de promoters distintos; previne duplicata na mesma submissão
CREATE UNIQUE INDEX idx_guest_unique_per_submission
  ON guest_records (evento_instancia_id, LOWER(nome), submission_id);

CREATE INDEX idx_guest_evento   ON guest_records(evento_instancia_id);
CREATE INDEX idx_guest_status   ON guest_records(status);
CREATE INDEX idx_guest_nome     ON guest_records(LOWER(nome));
CREATE INDEX idx_guest_search   ON guest_records USING gin(to_tsvector('portuguese', nome));

-- ── 7. check_in_records ──────────────────────────────────────

CREATE TABLE check_in_records (
  id                     UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id               UUID           NOT NULL REFERENCES guest_records(id) ON DELETE CASCADE,
  evento_instancia_id    UUID           NOT NULL REFERENCES eventos_instancia(id) ON DELETE CASCADE,
  timestamp_entrada      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  horario_evento_inicio  TIME           NOT NULL, -- snapshot
  horario_evento_fim     TIME           NOT NULL, -- snapshot
  horario_vip_limite     TIME           NOT NULL, -- snapshot
  tipo_cliente           guest_tipo     NOT NULL, -- snapshot
  portaria_user_id       UUID           REFERENCES users(id) ON DELETE SET NULL,
  status                 checkin_status NOT NULL DEFAULT 'Presente',
  created_at             TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_checkin_per_guest UNIQUE (guest_id, evento_instancia_id)
);

CREATE INDEX idx_checkin_evento     ON check_in_records(evento_instancia_id);
CREATE INDEX idx_checkin_timestamp  ON check_in_records(timestamp_entrada);
CREATE INDEX idx_checkin_guest      ON check_in_records(guest_id);

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE boates            ENABLE ROW LEVEL SECURITY;
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_template  ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_instancia ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_records  ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas dados da sua boate
CREATE POLICY "isolamento_boate_instancias" ON eventos_instancia
  FOR ALL USING (
    boate_id = (SELECT boate_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "isolamento_boate_guests" ON guest_records
  FOR ALL USING (
    evento_instancia_id IN (
      SELECT id FROM eventos_instancia
      WHERE boate_id = (SELECT boate_id FROM users WHERE id = auth.uid())
    )
  );

-- Submissões públicas podem ser inseridas sem auth (endpoint /api/submit-names)
CREATE POLICY "submit_publico_insert" ON guest_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "isolamento_boate_submissions" ON guest_submissions
  FOR SELECT USING (
    evento_instancia_id IN (
      SELECT id FROM eventos_instancia
      WHERE boate_id = (SELECT boate_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "portaria_checkin_insert" ON check_in_records
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Portaria'))
  );

CREATE POLICY "isolamento_boate_checkins" ON check_in_records
  FOR SELECT USING (
    evento_instancia_id IN (
      SELECT id FROM eventos_instancia
      WHERE boate_id = (SELECT boate_id FROM users WHERE id = auth.uid())
    )
  );

-- Admins têm acesso total aos eventos
CREATE POLICY "admin_full_eventos_template" ON eventos_template
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
  );

-- Usuários veem seu próprio perfil
CREATE POLICY "users_own_profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "admin_see_boate_users" ON users
  FOR ALL USING (
    boate_id = (SELECT boate_id FROM users u2 WHERE u2.id = auth.uid() AND u2.role = 'Admin')
  );
