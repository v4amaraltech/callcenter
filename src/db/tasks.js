import { query, queryOne, execute } from "./pg.js";
import { randomUUID } from "crypto";

const PROXIMA_ACAO_MAP = {
  enviar_whatsapp:   { tipo: "whatsapp",        titulo: "Enviar mensagem via WhatsApp",   horasAte: 2 },
  enviar_email:      { tipo: "email",            titulo: "Enviar e-mail de acompanhamento", horasAte: 4 },
  agendar_reuniao:   { tipo: "reuniao",          titulo: "Agendar reunião com o lead",     horasAte: 24 },
  nao_contatar:      { tipo: null,               titulo: null,                              horasAte: null },
  revisar_manualmente: { tipo: "revisar",        titulo: "Revisar ligação manualmente",    horasAte: 48 },
};

export async function createTaskFromCallResult(callResultId, leadId, proximaAcao) {
  const map = PROXIMA_ACAO_MAP[proximaAcao];
  if (!map || !map.tipo) return null;

  const prazo = new Date();
  prazo.setHours(prazo.getHours() + map.horasAte);

  return queryOne(
    `INSERT INTO tasks (id, lead_id, call_result_id, tipo, titulo, prazo, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pendente')
     RETURNING *`,
    [randomUUID(), leadId ?? null, callResultId ?? null, map.tipo, map.titulo, prazo.toISOString()]
  );
}

export async function listTasks({ page = 1, limit = 50, status, tipo, lead_id } = {}) {
  const conditions = [];
  const params = [];

  if (status)  { params.push(status);  conditions.push(`t.status = $${params.length}`); }
  if (tipo)    { params.push(tipo);    conditions.push(`t.tipo = $${params.length}`); }
  if (lead_id) { params.push(lead_id); conditions.push(`t.lead_id = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const rows = await query(
    `SELECT t.*,
            json_build_object('nome', l.nome, 'empresa', l.empresa, 'telefone', l.telefone) AS lead
     FROM tasks t
     LEFT JOIN leads l ON l.id = t.lead_id
     ${where}
     ORDER BY
       CASE t.status WHEN 'pendente' THEN 0 WHEN 'em_andamento' THEN 1 ELSE 2 END,
       t.prazo ASC NULLS LAST,
       t.criado_em DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const countParams = params.slice(0, params.length - 2);
  const countRes = await queryOne(
    `SELECT COUNT(*) AS total FROM tasks t ${where}`,
    countParams
  );

  return { data: rows, count: parseInt(countRes?.total ?? "0"), page, limit };
}

export async function getTasksByLeadId(leadId) {
  return query(
    `SELECT t.* FROM tasks t
     WHERE t.lead_id = $1
     ORDER BY t.prazo ASC NULLS LAST, t.criado_em DESC`,
    [leadId]
  );
}

export async function createTask({ lead_id, call_result_id, tipo, titulo, descricao, prazo }) {
  return queryOne(
    `INSERT INTO tasks (id, lead_id, call_result_id, tipo, titulo, descricao, prazo, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'pendente')
     RETURNING *`,
    [randomUUID(), lead_id ?? null, call_result_id ?? null, tipo, titulo, descricao ?? null, prazo ?? null]
  );
}

export async function updateTask(id, { status, titulo, descricao, prazo, tipo }) {
  const sets = [];
  const params = [];

  if (status !== undefined) {
    params.push(status); sets.push(`status = $${params.length}`);
    if (status === "concluido") {
      sets.push(`concluido_em = now()`);
    }
  }
  if (titulo !== undefined)   { params.push(titulo);   sets.push(`titulo = $${params.length}`); }
  if (descricao !== undefined){ params.push(descricao); sets.push(`descricao = $${params.length}`); }
  if (prazo !== undefined)    { params.push(prazo);     sets.push(`prazo = $${params.length}`); }
  if (tipo !== undefined)     { params.push(tipo);      sets.push(`tipo = $${params.length}`); }

  if (!sets.length) throw new Error("Nenhum campo para atualizar");

  params.push(id);
  return queryOne(
    `UPDATE tasks SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
}

export async function deleteTask(id) {
  await execute("DELETE FROM tasks WHERE id = $1", [id]);
}

export async function getTasksStats() {
  const rows = await query(
    `SELECT status, COUNT(*) AS total FROM tasks GROUP BY status`
  );
  const map = Object.fromEntries(rows.map(r => [r.status, parseInt(r.total)]));
  return {
    pendente:     map.pendente     ?? 0,
    em_andamento: map.em_andamento ?? 0,
    concluido:    map.concluido    ?? 0,
    cancelado:    map.cancelado    ?? 0,
    total:        rows.reduce((s, r) => s + parseInt(r.total), 0),
  };
}
