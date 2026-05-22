-- =============================================================================
-- SCHEMA BASE COMPLETO — PostgreSQL self-hosted (substitui Supabase)
-- Execute este arquivo UMA VEZ no PostgreSQL da VPS antes de rodar o app.
-- =============================================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- NextAuth.js v5 — tabelas de sessão/auth (substitui auth.users do Supabase)
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text,
  email         text UNIQUE NOT NULL,
  email_verified timestamptz,
  image         text,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                text NOT NULL,
  provider            text NOT NULL,
  provider_account_id text NOT NULL,
  refresh_token       text,
  access_token        text,
  expires_at          bigint,
  token_type          text,
  scope               text,
  id_token            text,
  session_state       text,
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text UNIQUE NOT NULL,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires       timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier text NOT NULL,
  token      text NOT NULL,
  expires    timestamptz NOT NULL,
  PRIMARY KEY(identifier, token)
);

-- =============================================================================
-- Aprovação de usuários (substitui user_approvals com auth.users do Supabase)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_approvals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email        text NOT NULL,
  approved     boolean DEFAULT false,
  admin        boolean DEFAULT false,
  approved_by  uuid REFERENCES users(id),
  approved_at  timestamptz,
  created_at   timestamptz DEFAULT now()
);

-- =============================================================================
-- Bot Config global
-- =============================================================================

CREATE TABLE IF NOT EXISTS bot_config (
  id               integer PRIMARY KEY DEFAULT 1,
  empresa_nome     text DEFAULT 'Minha Empresa',
  modelo_gemini    text DEFAULT 'gemini-2.0-flash-live-001',
  voz              text DEFAULT 'Kore',
  quem_fala_primeiro text DEFAULT 'agente' CHECK (quem_fala_primeiro IN ('agente', 'usuario')),
  prompt_template  text DEFAULT '',
  timeout_segundos integer DEFAULT 120,
  atualizado_em    timestamptz DEFAULT now(),
  CONSTRAINT only_one_row CHECK (id = 1)
);

-- Garante linha padrão
INSERT INTO bot_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- =============================================================================
-- Agentes de voz
-- =============================================================================

CREATE TABLE IF NOT EXISTS agents (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                     text NOT NULL,
  ativo                    boolean NOT NULL DEFAULT true,
  empresa_nome             text,
  empresa_contexto         jsonb DEFAULT '{}'::jsonb,
  prompt_template          text DEFAULT '',
  instrucoes_background    text DEFAULT '',
  modelo_gemini            text DEFAULT 'gemini-2.0-flash-live-001',
  voz                      text DEFAULT 'Kore',
  timeout_segundos         integer DEFAULT 120,
  quem_fala_primeiro       text DEFAULT 'agente' CHECK (quem_fala_primeiro IN ('agente', 'usuario')),
  webhook_saida_url        text,
  webhook_entrada_token    text UNIQUE,
  telefone_json_path       text,
  -- Configurações avançadas VAD / comportamento
  vad_silencio_ms          integer DEFAULT 800,
  vad_sensibilidade_inicio text DEFAULT 'START_SENSITIVITY_LOW',
  vad_sensibilidade_fim    text DEFAULT 'END_SENSITIVITY_LOW',
  interrupcao_habilitada   boolean DEFAULT true,
  primeiro_turno_delay_ms  integer DEFAULT 500,
  silencio_encerrar_seg    integer DEFAULT 0,
  deteccao_voicemail       boolean DEFAULT false,
  criado_em                timestamptz DEFAULT now(),
  atualizado_em            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agents_ativo_idx ON agents (ativo);

-- =============================================================================
-- Campanhas
-- =============================================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  descricao  text,
  objetivo   text,
  oferta     text,
  ativo      boolean DEFAULT true,
  agent_id   uuid REFERENCES agents(id) ON DELETE SET NULL,
  criado_em  timestamptz DEFAULT now()
);

-- =============================================================================
-- Leads
-- =============================================================================

CREATE TABLE IF NOT EXISTS leads (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                 text,
  empresa              text,
  cargo                text,
  telefone             text,
  telefone_normalizado text,
  origem               text,
  objetivo             text,
  oferta               text,
  campaign_id          uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  agent_id             uuid REFERENCES agents(id) ON DELETE SET NULL,
  payload_extras       jsonb DEFAULT '{}'::jsonb,
  status               text DEFAULT 'novo',
  ultima_ligacao_em    timestamptz,
  tentativas           integer DEFAULT 0,
  criado_em            timestamptz DEFAULT now()
);

-- Backfill telefone_normalizado para leads existentes
UPDATE leads
SET telefone_normalizado = '+' || regexp_replace(COALESCE(telefone, ''), '\D', '', 'g')
WHERE COALESCE(telefone, '') <> ''
  AND (telefone_normalizado IS NULL OR telefone_normalizado = '');

CREATE INDEX IF NOT EXISTS leads_campaign_id_idx      ON leads (campaign_id);
CREATE INDEX IF NOT EXISTS leads_agent_id_idx         ON leads (agent_id);
CREATE INDEX IF NOT EXISTS leads_status_idx           ON leads (status);
CREATE INDEX IF NOT EXISTS leads_phone_normalized_idx ON leads (telefone_normalizado);
CREATE INDEX IF NOT EXISTS leads_agent_status_criado_em_idx
  ON leads (agent_id, status, criado_em DESC)
  WHERE agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_nome_trgm_idx
  ON leads USING gin (nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS leads_empresa_trgm_idx
  ON leads USING gin (empresa gin_trgm_ops);

-- =============================================================================
-- Resultados de ligações
-- =============================================================================

CREATE TABLE IF NOT EXISTS call_results (
  id                  serial PRIMARY KEY,
  call_sid            text,
  lead_id             uuid REFERENCES leads(id) ON DELETE SET NULL,
  agent_id            uuid REFERENCES agents(id) ON DELETE SET NULL,
  confirmado          boolean,
  pessoa_correta      boolean,
  interesse           text,
  humor               text,
  resumo              text,
  proxima_acao        text,
  transcricao_usuario text,
  transcricao_agente  text,
  criado_em           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS call_results_lead_id_idx         ON call_results (lead_id);
CREATE INDEX IF NOT EXISTS call_results_agent_id_idx        ON call_results (agent_id);
CREATE INDEX IF NOT EXISTS call_results_criado_em_idx       ON call_results (criado_em DESC);
CREATE INDEX IF NOT EXISTS call_results_agent_created_desc_idx
  ON call_results (agent_id, criado_em DESC)
  WHERE agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS call_results_lead_created_desc_idx
  ON call_results (lead_id, criado_em DESC)
  WHERE lead_id IS NOT NULL;

-- =============================================================================
-- Transcrições por turno
-- =============================================================================

CREATE TABLE IF NOT EXISTS transcripts (
  id       serial PRIMARY KEY,
  call_sid text NOT NULL,
  role     text NOT NULL CHECK (role IN ('user', 'agent')),
  texto    text NOT NULL,
  ts       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transcripts_call_sid_idx        ON transcripts (call_sid);
CREATE INDEX IF NOT EXISTS transcripts_call_sid_ts_desc_idx ON transcripts (call_sid, ts DESC);

-- =============================================================================
-- Informações chave-valor por lead
-- =============================================================================

CREATE TABLE IF NOT EXISTS lead_info_chave (
  id         serial PRIMARY KEY,
  lead_id    uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  chave      text NOT NULL,
  valor      text,
  criado_em  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_info_chave_lead_id_idx ON lead_info_chave (lead_id);

-- =============================================================================
-- Função RPC: increment_lead_attempts
-- =============================================================================

CREATE OR REPLACE FUNCTION increment_lead_attempts(lead_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE leads
  SET tentativas = COALESCE(tentativas, 0) + 1,
      ultima_ligacao_em = now()
  WHERE id = lead_id;
END;
$$ LANGUAGE plpgsql;
