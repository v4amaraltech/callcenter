import { query, queryOne, execute } from "./pg.js";

export async function saveCallAnalysis(callResultId, analysis) {
  if (!analysis) return null;

  return queryOne(
    `INSERT INTO call_analysis
       (call_result_id, qualidade_score, temperatura, satisfacao, sentimento,
        confianca_sentimento, sinais_compra, objecoes, topicos, momentos_chave,
        aderencia_roteiro, pontos_fortes, pontos_melhoria, resumo_executivo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [
      callResultId,
      analysis.qualidade_score ?? null,
      analysis.temperatura ?? null,
      analysis.satisfacao ?? null,
      analysis.sentimento ?? null,
      analysis.confianca_sentimento ?? null,
      JSON.stringify(analysis.sinais_compra ?? []),
      JSON.stringify(analysis.objecoes ?? []),
      JSON.stringify(analysis.topicos ?? []),
      JSON.stringify(analysis.momentos_chave ?? []),
      analysis.aderencia_roteiro ?? null,
      analysis.pontos_fortes ?? [],
      analysis.pontos_melhoria ?? [],
      analysis.resumo_executivo ?? null,
    ]
  );
}

export async function getCallAnalysisByResultId(callResultId) {
  return queryOne(
    "SELECT * FROM call_analysis WHERE call_result_id = $1",
    [callResultId]
  );
}

export async function getStatsQuality({ agent_id, from: dateFrom, to: dateTo } = {}) {
  const conditions = ["ca.qualidade_score IS NOT NULL"];
  const params = [];

  if (agent_id) { params.push(agent_id); conditions.push(`cr.agent_id = $${params.length}`); }
  if (dateFrom) { params.push(dateFrom); conditions.push(`cr.criado_em >= $${params.length}`); }
  if (dateTo)   { params.push(dateTo);   conditions.push(`cr.criado_em <= $${params.length}`); }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const rows = await query(
    `SELECT
       AVG(ca.qualidade_score)::numeric(4,2) AS qualidade_media,
       AVG(ca.aderencia_roteiro)::numeric(4,2) AS aderencia_media,
       COUNT(*) AS total_analisados
     FROM call_analysis ca
     JOIN call_results cr ON cr.id = ca.call_result_id
     ${where}`,
    params
  );

  const tempRows = await query(
    `SELECT ca.temperatura, COUNT(*) AS total
     FROM call_analysis ca
     JOIN call_results cr ON cr.id = ca.call_result_id
     ${where} AND ca.temperatura IS NOT NULL
     GROUP BY ca.temperatura`,
    params
  );

  return {
    ...rows[0],
    distribuicao_temperatura: tempRows,
  };
}

export async function getTopObjecoes({ agent_id, from: dateFrom, to: dateTo, limit: lim = 10 } = {}) {
  const conditions = [];
  const params = [];

  if (agent_id) { params.push(agent_id); conditions.push(`cr.agent_id = $${params.length}`); }
  if (dateFrom) { params.push(dateFrom); conditions.push(`cr.criado_em >= $${params.length}`); }
  if (dateTo)   { params.push(dateTo);   conditions.push(`cr.criado_em <= $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  params.push(lim);
  return query(
    `SELECT objecao, COUNT(*) AS frequencia
     FROM (
       SELECT jsonb_array_elements_text(ca.objecoes) AS objecao
       FROM call_analysis ca
       JOIN call_results cr ON cr.id = ca.call_result_id
       ${where}
     ) sub
     GROUP BY objecao
     ORDER BY frequencia DESC
     LIMIT $${params.length}`,
    params
  );
}
