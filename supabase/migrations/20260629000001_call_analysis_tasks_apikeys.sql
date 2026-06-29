-- ── Tabela: call_analysis ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.call_analysis (
  id                   SERIAL PRIMARY KEY,
  call_result_id       INTEGER NOT NULL REFERENCES public.call_results(id) ON DELETE CASCADE,
  qualidade_score      INTEGER CHECK (qualidade_score BETWEEN 1 AND 10),
  temperatura          TEXT CHECK (temperatura IN ('quente','morno','frio','gelado')),
  satisfacao           INTEGER CHECK (satisfacao BETWEEN 1 AND 5),
  sentimento           TEXT CHECK (sentimento IN ('positivo','neutro','negativo')),
  confianca_sentimento NUMERIC(4,2),
  sinais_compra        JSONB DEFAULT '[]',
  objecoes             JSONB DEFAULT '[]',
  topicos              JSONB DEFAULT '[]',
  momentos_chave       JSONB DEFAULT '[]',
  aderencia_roteiro    INTEGER CHECK (aderencia_roteiro BETWEEN 1 AND 10),
  pontos_fortes        TEXT[],
  pontos_melhoria      TEXT[],
  resumo_executivo     TEXT,
  criado_em            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS call_analysis_result_idx ON public.call_analysis(call_result_id);

-- ── Tabela: tasks ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         TEXT REFERENCES public.leads(id) ON DELETE CASCADE,
  call_result_id  INTEGER REFERENCES public.call_results(id) ON DELETE SET NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('whatsapp','email','reuniao','ligar_novamente','revisar')),
  titulo          TEXT NOT NULL,
  descricao       TEXT,
  prazo           TIMESTAMPTZ,
  status          TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluido','cancelado')),
  criado_em       TIMESTAMPTZ DEFAULT now(),
  concluido_em    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS tasks_lead_idx    ON public.tasks(lead_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx  ON public.tasks(status);
CREATE INDEX IF NOT EXISTS tasks_prazo_idx   ON public.tasks(prazo) WHERE status = 'pendente';

-- ── Tabela: api_keys ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  key_hash    TEXT NOT NULL UNIQUE,
  key_prefix  TEXT NOT NULL,
  ativo       BOOLEAN DEFAULT true,
  permissoes  TEXT[] DEFAULT '{read,write}',
  ultima_uso  TIMESTAMPTZ,
  criado_em   TIMESTAMPTZ DEFAULT now(),
  criado_por  UUID
);

CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON public.api_keys(key_hash) WHERE ativo = true;

-- ── Coluna: agents.roteiro ──────────────────────────────────────────────────
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS roteiro JSONB DEFAULT NULL;

-- Acesso controlado pelo backend (sem RLS — auth via API keys e NextAuth)
