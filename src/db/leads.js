import { pool, query, queryOne, execute } from "./pg.js";

export function normalizePhone(phone) {
  const digits = String(phone ?? "").replace(/\D+/g, "");
  return digits ? `+${digits}` : null;
}

function withNormalizedPhone(lead = {}) {
  const normalized = normalizePhone(lead.telefone);
  return normalized
    ? { ...lead, telefone: normalized, telefone_normalizado: normalized }
    : lead;
}

export async function getLeadById(id) {
  return queryOne(
    `SELECT l.*,
            row_to_json(a.*) AS agents,
            row_to_json(c.*) AS campaigns
     FROM leads l
     LEFT JOIN agents a ON a.id = l.agent_id
     LEFT JOIN campaigns c ON c.id = l.campaign_id
     WHERE l.id = $1`,
    [id]
  );
}

export async function listLeads({ page = 1, limit = 50, status, campaign_id, agent_id, q } = {}) {
  const conditions = [];
  const params = [];

  if (status)      { params.push(status);      conditions.push(`l.status = $${params.length}`); }
  if (campaign_id) { params.push(campaign_id); conditions.push(`l.campaign_id = $${params.length}`); }
  if (agent_id)    { params.push(agent_id);    conditions.push(`l.agent_id = $${params.length}`); }

  if (q) {
    const normalized = normalizePhone(q);
    if (normalized) {
      params.push(`%${q}%`);
      params.push(normalized);
      conditions.push(`(l.nome ILIKE $${params.length - 1} OR l.empresa ILIKE $${params.length - 1} OR l.telefone ILIKE $${params.length - 1} OR l.telefone_normalizado = $${params.length})`);
    } else {
      params.push(`%${q}%`);
      conditions.push(`(l.nome ILIKE $${params.length} OR l.empresa ILIKE $${params.length} OR l.telefone ILIKE $${params.length})`);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * limit;

  params.push(limit, offset);
  const rows = await query(
    `SELECT l.id, l.nome, l.empresa, l.cargo, l.telefone, l.campaign_id, l.agent_id,
            l.status, l.ultima_ligacao_em, l.tentativas, l.criado_em,
            json_build_object('id', c.id, 'nome', c.nome) AS campaigns,
            json_build_object('id', a.id, 'nome', a.nome) AS agents
     FROM leads l
     LEFT JOIN campaigns c ON c.id = l.campaign_id
     LEFT JOIN agents a ON a.id = l.agent_id
     ${where}
     ORDER BY l.criado_em DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const countParams = params.slice(0, params.length - 2);
  const countRes = await queryOne(
    `SELECT COUNT(*) AS total FROM leads l ${where}`,
    countParams
  );

  return { data: rows, count: parseInt(countRes?.total ?? "0"), page, limit };
}

export async function upsertLead(lead) {
  const row = withNormalizedPhone(lead);
  if (row.id) {
    return queryOne(
      `INSERT INTO leads (id, nome, empresa, cargo, telefone, telefone_normalizado, origem, objetivo, oferta,
                          campaign_id, agent_id, payload_extras, status, criado_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,COALESCE($14,now()))
       ON CONFLICT (id) DO UPDATE SET
         nome=$2, empresa=$3, cargo=$4, telefone=$5, telefone_normalizado=$6,
         origem=$7, objetivo=$8, oferta=$9, campaign_id=$10, agent_id=$11,
         payload_extras=$12, status=$13
       RETURNING *`,
      [row.id, row.nome, row.empresa, row.cargo, row.telefone, row.telefone_normalizado,
       row.origem, row.objetivo, row.oferta, row.campaign_id ?? null, row.agent_id ?? null,
       JSON.stringify(row.payload_extras ?? {}), row.status ?? "novo", row.criado_em ?? null]
    );
  }
  return queryOne(
    `INSERT INTO leads (nome, empresa, cargo, telefone, telefone_normalizado, origem, objetivo, oferta,
                        campaign_id, agent_id, payload_extras, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [row.nome, row.empresa, row.cargo, row.telefone, row.telefone_normalizado,
     row.origem, row.objetivo, row.oferta, row.campaign_id ?? null, row.agent_id ?? null,
     JSON.stringify(row.payload_extras ?? {}), row.status ?? "novo"]
  );
}

export async function updateLead(id, fields) {
  const row = withNormalizedPhone(fields);
  const sets = [];
  const params = [];
  const allowed = ["nome","empresa","cargo","telefone","telefone_normalizado","origem","objetivo","oferta",
                   "campaign_id","agent_id","payload_extras","status","ultima_ligacao_em","tentativas"];
  for (const key of allowed) {
    if (key in row) {
      params.push(key === "payload_extras" ? JSON.stringify(row[key]) : row[key]);
      sets.push(`${key} = $${params.length}`);
    }
  }
  if (!sets.length) return getLeadById(id);
  params.push(id);
  return queryOne(
    `UPDATE leads SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
}

export async function deleteLead(id) {
  await execute("UPDATE leads SET status = 'arquivado' WHERE id = $1", [id]);
}

export async function bulkArchiveLeads(ids = []) {
  const uniqueIds = Array.from(new Set((ids ?? []).filter(Boolean)));
  if (!uniqueIds.length) return { count: 0 };
  const rows = await query(
    `UPDATE leads SET status = 'arquivado' WHERE id = ANY($1::uuid[]) RETURNING id`,
    [uniqueIds]
  );
  return { count: rows.length };
}

export async function bulkAssignLeads({ ids = [], agent_id, campaign_id }) {
  const uniqueIds = Array.from(new Set((ids ?? []).filter(Boolean)));
  if (!uniqueIds.length) return { count: 0 };

  const sets = [];
  const params = [uniqueIds];
  if (typeof agent_id !== "undefined")    { params.push(agent_id);    sets.push(`agent_id = $${params.length}`); }
  if (typeof campaign_id !== "undefined") { params.push(campaign_id); sets.push(`campaign_id = $${params.length}`); }
  if (!sets.length) return { count: 0 };

  const rows = await query(
    `UPDATE leads SET ${sets.join(", ")} WHERE id = ANY($1::uuid[]) RETURNING id`,
    params
  );
  return { count: rows.length };
}

export async function saveLeadInfoChave(leadId, chave, valor) {
  await execute(
    "INSERT INTO lead_info_chave (lead_id, chave, valor) VALUES ($1, $2, $3)",
    [leadId, chave, valor]
  );
}

export async function getLeadInfoChave(leadId) {
  return query(
    "SELECT * FROM lead_info_chave WHERE lead_id = $1 ORDER BY criado_em DESC",
    [leadId]
  );
}

export async function bulkImportLeads(leads) {
  const rows = (leads ?? []).map(withNormalizedPhone);
  const results = [];
  for (const row of rows) {
    const r = await upsertLead(row);
    if (r) results.push(r);
  }
  return results;
}

export async function getLatestLeadByPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return queryOne(
    `SELECT id, nome, empresa, cargo, telefone, telefone_normalizado, agent_id, campaign_id,
            payload_extras, status, ultima_ligacao_em, criado_em
     FROM leads
     WHERE telefone_normalizado = $1
     ORDER BY ultima_ligacao_em DESC NULLS LAST, criado_em DESC
     LIMIT 1`,
    [normalized]
  );
}

export async function incrementLeadAttempts(id) {
  await pool.query(
    `UPDATE leads SET tentativas = COALESCE(tentativas,0)+1, ultima_ligacao_em = now() WHERE id = $1`,
    [id]
  );
  await execute(
    `UPDATE leads SET ultima_ligacao_em = now(), status = 'contactado' WHERE id = $1 AND status = 'novo'`,
    [id]
  );
}
