import { query, queryOne, execute } from "./pg.js";

export async function listCampaigns() {
  return query(
    `SELECT c.*, COUNT(l.id) AS leads_count
     FROM campaigns c
     LEFT JOIN leads l ON l.campaign_id = c.id
     GROUP BY c.id
     ORDER BY c.criado_em DESC`
  );
}

export async function getCampaignById(id) {
  const campaign = await queryOne("SELECT * FROM campaigns WHERE id = $1", [id]);
  if (!campaign) return null;
  const leads = await query("SELECT * FROM leads WHERE campaign_id = $1", [id]);
  return { ...campaign, leads };
}

export async function createCampaign(fields) {
  const cols = ["nome","descricao","objetivo","oferta","ativo","agent_id"].filter(k => k in fields);
  const vals = cols.map(k => fields[k]);
  const placeholders = vals.map((_, i) => `$${i + 1}`);
  return queryOne(
    `INSERT INTO campaigns (${cols.join(",")}) VALUES (${placeholders.join(",")}) RETURNING *`,
    vals
  );
}

export async function updateCampaign(id, fields) {
  const allowed = ["nome","descricao","objetivo","oferta","ativo","agent_id"];
  const sets = [];
  const params = [];
  for (const key of allowed) {
    if (key in fields) {
      params.push(fields[key]);
      sets.push(`${key} = $${params.length}`);
    }
  }
  if (!sets.length) return getCampaignById(id);
  params.push(id);
  return queryOne(
    `UPDATE campaigns SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
}

export async function deleteCampaign(id) {
  await execute("DELETE FROM campaigns WHERE id = $1", [id]);
}

export async function getCampaignStats(id) {
  const leads = await query("SELECT id, status FROM leads WHERE campaign_id = $1", [id]);
  const leadIds = leads.map(l => l.id);

  const results = leadIds.length
    ? await query(
        "SELECT interesse FROM call_results WHERE lead_id = ANY($1::uuid[])",
        [leadIds]
      )
    : [];

  const total        = leads.length;
  const contactados  = leads.filter(l => l.status !== "novo").length;
  const alto         = results.filter(r => r.interesse === "alto").length;

  return {
    total_leads:          total,
    contactados,
    pendentes:            total - contactados,
    taxa_interesse_alto:  results.length ? Math.round((alto / results.length) * 100) : 0,
  };
}
