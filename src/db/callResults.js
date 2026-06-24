import { query, queryOne, execute } from "./pg.js";
import { getLatestLeadByPhone } from "./leads.js";

function countWords(text) {
  return (text ?? "").split(/\s+/).filter(Boolean).length;
}

export async function saveCallResult({
  callSid, leadId, agentId,
  confirmado, pessoa_correta, interesse, humor,
  resumo, proxima_acao,
}) {
  const transcripts = await query(
    "SELECT role, texto, ts FROM transcripts WHERE call_sid = $1 ORDER BY ts",
    [callSid ?? ""]
  );

  const transcricao_usuario = transcripts.filter(r => r.role === "user").map(r => r.texto).join(" ");
  const transcricao_agente  = transcripts.filter(r => r.role === "agent").map(r => r.texto).join(" ");

  // Calcular duração pela diferença entre primeiro e último transcript
  let duracao_segundos = null;
  if (transcripts.length >= 2) {
    const first = new Date(transcripts[0].ts);
    const last  = new Date(transcripts[transcripts.length - 1].ts);
    const diff  = Math.round((last - first) / 1000);
    if (diff > 0) duracao_segundos = diff;
  }

  // Contagem de palavras
  const palavras_agente  = countWords(transcricao_agente);
  const palavras_cliente = countWords(transcricao_usuario);
  const palavras_total   = palavras_agente + palavras_cliente;

  const result = await queryOne(
    `INSERT INTO call_results
       (call_sid, lead_id, agent_id, confirmado, pessoa_correta, interesse, humor,
        resumo, proxima_acao, transcricao_usuario, transcricao_agente,
        duracao_segundos, palavras_total, palavras_agente, palavras_cliente)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [callSid ?? null, leadId ?? null, agentId ?? null,
     confirmado, pessoa_correta, interesse, humor,
     resumo, proxima_acao, transcricao_usuario, transcricao_agente,
     duracao_segundos, palavras_total || null, palavras_agente || null, palavras_cliente || null]
  );

  if (leadId) {
    const novoStatus = proxima_acao === "nao_contatar"
      ? "nao_contatar"
      : interesse === "alto" ? "convertido" : "contactado";
    await execute(
      "UPDATE leads SET status = $1, ultima_ligacao_em = now(), tentativas = tentativas + 1 WHERE id = $2",
      [novoStatus, leadId]
    );
  }

  return result;
}

export async function appendTranscript(callSid, role, texto) {
  if (!callSid || !texto?.trim()) return;
  await execute(
    "INSERT INTO transcripts (call_sid, role, texto) VALUES ($1, $2, $3)",
    [callSid, role, texto.trim()]
  );
}

export function mergeTranscriptsToBubbles(rows) {
  const sorted = [...(rows ?? [])].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  const bubbles = [];
  for (const row of sorted) {
    const last = bubbles[bubbles.length - 1];
    if (last && last.role === row.role) {
      last.texto = `${last.texto} ${row.texto}`.trim();
      last.ts_end = row.ts;
    } else {
      bubbles.push({ role: row.role, texto: row.texto, ts: row.ts, ts_end: row.ts });
    }
  }
  return bubbles;
}

export async function getTranscriptsByCallSid(callSid) {
  return query("SELECT * FROM transcripts WHERE call_sid = $1 ORDER BY ts", [callSid]);
}

export async function getTranscriptsConversation(callSid) {
  const raw = await getTranscriptsByCallSid(callSid);
  return { raw, bubbles: mergeTranscriptsToBubbles(raw) };
}

function buildTranscriptSummary(bubbles) {
  return (bubbles ?? [])
    .map(item => `${item.role === "agent" ? "Agente" : "Cliente"}: ${item.texto}`)
    .join("\n");
}

export async function listCallResults({
  page = 1, limit = 50,
  lead_id, agent_id, interesse, humor, proxima_acao,
  from: dateFrom, to: dateTo,
} = {}) {
  const conditions = [];
  const params = [];

  if (lead_id)     { params.push(lead_id);     conditions.push(`cr.lead_id = $${params.length}`); }
  if (agent_id)    { params.push(agent_id);    conditions.push(`cr.agent_id = $${params.length}`); }
  if (interesse)   { params.push(interesse);   conditions.push(`cr.interesse = $${params.length}`); }
  if (humor)       { params.push(humor);       conditions.push(`cr.humor = $${params.length}`); }
  if (proxima_acao){ params.push(proxima_acao);conditions.push(`cr.proxima_acao = $${params.length}`); }
  if (dateFrom)    { params.push(dateFrom);    conditions.push(`cr.criado_em >= $${params.length}`); }
  if (dateTo)      { params.push(dateTo);      conditions.push(`cr.criado_em <= $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const rows = await query(
    `SELECT cr.id, cr.call_sid, cr.lead_id, cr.agent_id, cr.interesse, cr.humor,
            cr.resumo, cr.proxima_acao, cr.criado_em,
            json_build_object('nome', l.nome, 'empresa', l.empresa, 'telefone', l.telefone) AS leads,
            json_build_object('nome', a.nome) AS agents
     FROM call_results cr
     LEFT JOIN leads l ON l.id = cr.lead_id
     LEFT JOIN agents a ON a.id = cr.agent_id
     ${where}
     ORDER BY cr.criado_em DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const countParams = params.slice(0, params.length - 2);
  const countRes = await queryOne(
    `SELECT COUNT(*) AS total FROM call_results cr ${where}`,
    countParams
  );

  return { data: rows, count: parseInt(countRes?.total ?? "0"), page, limit };
}

export async function getCallResultById(id) {
  return queryOne(
    `SELECT cr.*,
            json_build_object('nome', l.nome, 'empresa', l.empresa, 'telefone', l.telefone) AS leads,
            json_build_object('nome', a.nome, 'webhook_entrada_token', a.webhook_entrada_token) AS agents
     FROM call_results cr
     LEFT JOIN leads l ON l.id = cr.lead_id
     LEFT JOIN agents a ON a.id = cr.agent_id
     WHERE cr.id = $1`,
    [id]
  );
}

export async function getLatestResultByPhone(phone) {
  const lead = await getLatestLeadByPhone(phone);
  if (!lead) return null;
  return queryOne(
    `SELECT cr.*,
            json_build_object('nome', l.nome, 'empresa', l.empresa, 'telefone', l.telefone, 'ultima_ligacao_em', l.ultima_ligacao_em) AS leads,
            json_build_object('nome', a.nome, 'webhook_entrada_token', a.webhook_entrada_token) AS agents
     FROM call_results cr
     LEFT JOIN leads l ON l.id = cr.lead_id
     LEFT JOIN agents a ON a.id = cr.agent_id
     WHERE cr.lead_id = $1
     ORDER BY cr.criado_em DESC
     LIMIT 1`,
    [lead.id]
  );
}

export async function getLatestConversationByPhone(phone) {
  const result = await getLatestResultByPhone(phone);
  if (!result?.call_sid) return null;
  const conversation = await getTranscriptsConversation(result.call_sid);
  return {
    ...conversation,
    call_result: result,
    texto: buildTranscriptSummary(conversation.bubbles),
  };
}

export async function getStatsSummary({ agent_id } = {}) {
  const conditions = agent_id ? ["agent_id = $1"] : [];
  const params = agent_id ? [agent_id] : [];
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const results = await query(
    `SELECT interesse, humor, criado_em, agent_id FROM call_results ${where}`,
    params
  );

  const hoje  = new Date().toISOString().slice(0, 10);
  const total = results.length;
  const hoje_count    = results.filter(r => r.criado_em?.toISOString?.().slice(0,10) === hoje || String(r.criado_em).slice(0,10) === hoje).length;
  const alto_interesse = results.filter(r => r.interesse === "alto").length;
  const convertidos   = results.filter(r => r.interesse === "alto" || r.interesse === "medio").length;

  return {
    total_ligacoes:      total,
    ligacoes_hoje:       hoje_count,
    taxa_interesse_alto: total ? Math.round((alto_interesse / total) * 100) : 0,
    taxa_conversao:      total ? Math.round((convertidos / total) * 100) : 0,
  };
}

export async function getStatsByDate({ from: dateFrom, to: dateTo, agent_id } = {}) {
  const conditions = [];
  const params = [];
  if (dateFrom)  { params.push(dateFrom);  conditions.push(`criado_em >= $${params.length}`); }
  if (dateTo)    { params.push(dateTo);    conditions.push(`criado_em <= $${params.length}`); }
  if (agent_id)  { params.push(agent_id); conditions.push(`agent_id = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query(`SELECT criado_em, interesse, agent_id FROM call_results ${where} ORDER BY criado_em`, params);

  const byDay = {};
  for (const r of rows) {
    const day = String(r.criado_em).slice(0, 10);
    if (!day) continue;
    if (!byDay[day]) byDay[day] = { date: day, total: 0, alto: 0 };
    byDay[day].total++;
    if (r.interesse === "alto") byDay[day].alto++;
  }
  return Object.values(byDay);
}

export async function getStatsByAgent({ from: dateFrom, to: dateTo } = {}) {
  const conditions = [];
  const params = [];
  if (dateFrom) { params.push(dateFrom); conditions.push(`criado_em >= $${params.length}`); }
  if (dateTo)   { params.push(dateTo);   conditions.push(`criado_em <= $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query(`SELECT agent_id, interesse, criado_em FROM call_results ${where}`, params);

  const byAgent = {};
  for (const r of rows) {
    const aid = r.agent_id ?? "none";
    if (!byAgent[aid]) byAgent[aid] = { agent_id: r.agent_id, total: 0, alto: 0 };
    byAgent[aid].total++;
    if (r.interesse === "alto") byAgent[aid].alto++;
  }

  const agentRows = await query("SELECT id, nome FROM agents");
  const idToName = Object.fromEntries(agentRows.map(a => [a.id, a.nome]));

  return Object.values(byAgent).map(row => ({
    ...row,
    agent_nome: row.agent_id ? (idToName[row.agent_id] ?? "—") : "Sem agente",
  }));
}
