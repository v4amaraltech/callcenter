import { GoogleGenAI } from "@google/genai";

const ANALYSIS_PROMPT = `Você é um especialista em análise de ligações de vendas B2B. Analise a transcrição abaixo e retorne um JSON com insights profundos.

CONTEXTO DA LIGAÇÃO:
- Objetivo: {{objetivo}}
- Oferta: {{oferta}}
- Resumo gerado pela IA: {{resumo}}

TRANSCRIÇÃO — AGENTE:
{{transcricao_agente}}

TRANSCRIÇÃO — CLIENTE:
{{transcricao_usuario}}

Retorne APENAS um JSON válido (sem markdown, sem comentários) com esta estrutura exata:
{
  "qualidade_score": <inteiro 1-10, avalie a qualidade geral da ligação>,
  "temperatura": <"quente" | "morno" | "frio" | "gelado">,
  "satisfacao": <inteiro 1-5, estimativa de satisfação do cliente>,
  "sentimento": <"positivo" | "neutro" | "negativo">,
  "confianca_sentimento": <decimal 0.00-1.00>,
  "sinais_compra": [<lista de frases ou comportamentos que indicam interesse de compra>],
  "objecoes": [<lista de objeções levantadas pelo cliente>],
  "topicos": [<lista de tópicos abordados na conversa>],
  "momentos_chave": [
    {"momento": <"abertura"|"qualificacao"|"apresentacao"|"objecao"|"cta"|"encerramento">, "tipo": <"positivo"|"negativo"|"neutro">, "texto": <trecho relevante>}
  ],
  "aderencia_roteiro": <inteiro 1-10, o agente seguiu uma estrutura lógica de vendas?>,
  "pontos_fortes": [<o que o agente fez bem>],
  "pontos_melhoria": [<o que pode melhorar>],
  "resumo_executivo": <2-3 frases resumindo a ligação do ponto de vista estratégico>
}

Regras:
- Se a transcrição for vazia ou muito curta, retorne campos mínimos com "temperatura": "gelado", "qualidade_score": 1
- Seja preciso e objetivo. Não invente informações que não estão na transcrição.
- Os arrays podem ser vazios [] se não houver dados relevantes.`;

export async function analyzeCall({ transcricao_agente, transcricao_usuario, resumo, objetivo, oferta }) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("[analyzeCall] GEMINI_API_KEY não configurado");
    return null;
  }

  const agentText = (transcricao_agente ?? "").trim();
  const userText = (transcricao_usuario ?? "").trim();

  if (!agentText && !userText) {
    console.log("[analyzeCall] Transcrição vazia — pulando análise");
    return null;
  }

  const prompt = ANALYSIS_PROMPT
    .replace("{{objetivo}}", objetivo ?? "Não informado")
    .replace("{{oferta}}", oferta ?? "Não informado")
    .replace("{{resumo}}", resumo ?? "Não informado")
    .replace("{{transcricao_agente}}", agentText || "(sem fala do agente)")
    .replace("{{transcricao_usuario}}", userText || "(sem fala do cliente)");

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.2 },
    });

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(cleaned);

    // Validar e normalizar campos críticos
    return {
      qualidade_score: clampInt(parsed.qualidade_score, 1, 10),
      temperatura: ["quente", "morno", "frio", "gelado"].includes(parsed.temperatura) ? parsed.temperatura : "frio",
      satisfacao: clampInt(parsed.satisfacao, 1, 5),
      sentimento: ["positivo", "neutro", "negativo"].includes(parsed.sentimento) ? parsed.sentimento : "neutro",
      confianca_sentimento: clampFloat(parsed.confianca_sentimento, 0, 1),
      sinais_compra: Array.isArray(parsed.sinais_compra) ? parsed.sinais_compra : [],
      objecoes: Array.isArray(parsed.objecoes) ? parsed.objecoes : [],
      topicos: Array.isArray(parsed.topicos) ? parsed.topicos : [],
      momentos_chave: Array.isArray(parsed.momentos_chave) ? parsed.momentos_chave : [],
      aderencia_roteiro: clampInt(parsed.aderencia_roteiro, 1, 10),
      pontos_fortes: Array.isArray(parsed.pontos_fortes) ? parsed.pontos_fortes : [],
      pontos_melhoria: Array.isArray(parsed.pontos_melhoria) ? parsed.pontos_melhoria : [],
      resumo_executivo: typeof parsed.resumo_executivo === "string" ? parsed.resumo_executivo : null,
    };
  } catch (err) {
    console.error("[analyzeCall] Erro ao analisar ligação:", err.message);
    return null;
  }
}

function clampInt(val, min, max) {
  const n = parseInt(val);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}

function clampFloat(val, min, max) {
  const n = parseFloat(val);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}
