import { queryOne } from "./pg.js";

export async function getBotConfig() {
  const data = await queryOne("SELECT * FROM bot_config WHERE id = 1");
  return data ?? {
    empresa_nome:      process.env.EMPRESA_NOME ?? "Minha Empresa",
    modelo_gemini:     process.env.GEMINI_MODEL ?? "gemini-2.0-flash-live-001",
    voz:               process.env.GEMINI_VOICE ?? "Kore",
    quem_fala_primeiro:"agente",
    prompt_template:   "",
    timeout_segundos:  120,
  };
}

export async function updateBotConfig(fields) {
  const allowed = ["empresa_nome","modelo_gemini","voz","quem_fala_primeiro","prompt_template","timeout_segundos"];
  const sets = ["atualizado_em = now()"];
  const params = [];
  for (const key of allowed) {
    if (key in fields) {
      params.push(fields[key]);
      sets.push(`${key} = $${params.length}`);
    }
  }
  return queryOne(
    `INSERT INTO bot_config (id, ${allowed.filter(k => k in fields).join(",")}, atualizado_em)
     VALUES (1, ${params.map((_, i) => `$${i + 1}`).join(",")}, now())
     ON CONFLICT (id) DO UPDATE SET ${sets.join(", ")}
     RETURNING *`,
    params
  );
}
