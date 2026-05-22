import { randomBytes } from "crypto";
import { query, queryOne, execute } from "./pg.js";
import { getBotConfig } from "./botConfig.js";

function buildInboundToken() {
  return randomBytes(24).toString("hex");
}

async function ensureInboundToken(agent) {
  if (!agent) return null;
  if (agent.webhook_entrada_token) return agent;
  return updateAgent(agent.id, { webhook_entrada_token: buildInboundToken() });
}

async function getAgentRow(id) {
  if (!id) return null;
  return queryOne("SELECT * FROM agents WHERE id = $1", [id]);
}

export async function getEffectiveAgentConfig(agentRow) {
  const global = await getBotConfig();
  if (!agentRow) return global;

  let ctx = agentRow.empresa_contexto;
  if (typeof ctx === "string") {
    try { ctx = JSON.parse(ctx); } catch { ctx = {}; }
  }
  if (!ctx || typeof ctx !== "object") ctx = {};

  return {
    empresa_nome:             agentRow.empresa_nome             ?? global.empresa_nome,
    modelo_gemini:            agentRow.modelo_gemini            ?? global.modelo_gemini,
    voz:                      agentRow.voz                      ?? global.voz,
    quem_fala_primeiro:       agentRow.quem_fala_primeiro       ?? global.quem_fala_primeiro,
    prompt_template:          agentRow.prompt_template?.trim()  ? agentRow.prompt_template : global.prompt_template,
    timeout_segundos:         agentRow.timeout_segundos         ?? global.timeout_segundos,
    instrucoes_background:    agentRow.instrucoes_background    ?? "",
    empresa_contexto:         ctx,
    webhook_saida_url:        agentRow.webhook_saida_url        ?? null,
    vad_silencio_ms:          agentRow.vad_silencio_ms          ?? 800,
    vad_sensibilidade_inicio: agentRow.vad_sensibilidade_inicio ?? "START_SENSITIVITY_LOW",
    vad_sensibilidade_fim:    agentRow.vad_sensibilidade_fim    ?? "END_SENSITIVITY_LOW",
    interrupcao_habilitada:   agentRow.interrupcao_habilitada   ?? true,
    primeiro_turno_delay_ms:  agentRow.primeiro_turno_delay_ms  ?? 500,
    silencio_encerrar_seg:    agentRow.silencio_encerrar_seg    ?? 0,
    deteccao_voicemail:       agentRow.deteccao_voicemail       ?? false,
  };
}

export async function getAgentById(id) {
  return ensureInboundToken(await getAgentRow(id));
}

export async function listAgents({ includeInactive = false } = {}) {
  const sql = includeInactive
    ? "SELECT * FROM agents ORDER BY nome"
    : "SELECT * FROM agents WHERE ativo = true ORDER BY nome";
  const rows = await query(sql);
  return Promise.all(rows.map(ensureInboundToken));
}

export async function createAgent(fields) {
  const token = fields.webhook_entrada_token ?? buildInboundToken();
  const keys = ["nome","ativo","empresa_nome","empresa_contexto","prompt_template","instrucoes_background",
                 "modelo_gemini","voz","timeout_segundos","quem_fala_primeiro","webhook_saida_url",
                 "webhook_entrada_token","telefone_json_path","vad_silencio_ms","vad_sensibilidade_inicio",
                 "vad_sensibilidade_fim","interrupcao_habilitada","primeiro_turno_delay_ms",
                 "silencio_encerrar_seg","deteccao_voicemail"];
  const row = { ...fields, webhook_entrada_token: token, atualizado_em: new Date().toISOString() };

  const cols = keys.filter(k => k in row);
  const vals = cols.map(k => k === "empresa_contexto" ? JSON.stringify(row[k] ?? {}) : row[k]);
  const placeholders = vals.map((_, i) => `$${i + 1}`);

  return queryOne(
    `INSERT INTO agents (${cols.join(",")}, atualizado_em)
     VALUES (${placeholders.join(",")}, now())
     RETURNING *`,
    vals
  );
}

export async function updateAgent(id, fields) {
  const current = await getAgentRow(id);
  const webhookToken = fields.webhook_entrada_token ?? current?.webhook_entrada_token ?? buildInboundToken();

  const allowed = ["nome","ativo","empresa_nome","empresa_contexto","prompt_template","instrucoes_background",
                    "modelo_gemini","voz","timeout_segundos","quem_fala_primeiro","webhook_saida_url",
                    "webhook_entrada_token","telefone_json_path","vad_silencio_ms","vad_sensibilidade_inicio",
                    "vad_sensibilidade_fim","interrupcao_habilitada","primeiro_turno_delay_ms",
                    "silencio_encerrar_seg","deteccao_voicemail"];

  const row = { ...fields, webhook_entrada_token: webhookToken };
  const sets = [];
  const params = [];

  for (const key of allowed) {
    if (key in row) {
      params.push(key === "empresa_contexto" ? JSON.stringify(row[key] ?? {}) : row[key]);
      sets.push(`${key} = $${params.length}`);
    }
  }
  sets.push(`atualizado_em = now()`);
  params.push(id);

  const result = await queryOne(
    `UPDATE agents SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return ensureInboundToken(result);
}

export async function deleteAgent(id) {
  await execute("UPDATE agents SET ativo = false WHERE id = $1", [id]);
}

export async function regenerateInboundToken(id) {
  return updateAgent(id, { webhook_entrada_token: buildInboundToken() });
}

export async function getAgentByInboundToken(token) {
  if (!token) return null;
  const row = await queryOne("SELECT * FROM agents WHERE webhook_entrada_token = $1", [token]);
  return ensureInboundToken(row);
}
