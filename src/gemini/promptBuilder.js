import { buildLeadContextPromptBlock } from "../util/leadContext.js";

/**
 * Monta o system prompt para cada lead.
 * `agentConfig` vem de getEffectiveAgentConfig (agente + fallback bot_config).
 */
export function buildPromptForLead(lead, agentConfig = {}) {
  const empresa = agentConfig.empresa_nome ?? "[EMPRESA]";
  const template = agentConfig.prompt_template?.trim();

  let ctxBlock = "";
  const ec = agentConfig.empresa_contexto;
  if (ec && typeof ec === "object" && Object.keys(ec).length) {
    ctxBlock += `\n\nDados de contexto (empresa / agente):\n${JSON.stringify(ec, null, 2)}`;
  }
  const bg = agentConfig.instrucoes_background?.trim();
  if (bg) ctxBlock += `\n\nInstruções de background do agente:\n${bg}`;
  ctxBlock += buildLeadContextPromptBlock(lead?.payload_extras);

  // Bloco de roteiro estruturado (Fase 4)
  const roteiroBlock = buildRoteiroBlock(agentConfig.roteiro, lead);

  if (template) {
    let t = template
      .replace(/\{\{nome\}\}/g, lead.nome ?? "cliente")
      .replace(/\{\{empresa\}\}/g, lead.empresa ?? "não informada")
      .replace(/\{\{cargo\}\}/g, lead.cargo ?? "não informado")
      .replace(/\{\{origem\}\}/g, lead.origem ?? "não informada")
      .replace(/\{\{objetivo\}\}/g, lead.objetivo ?? "apresentar a empresa")
      .replace(/\{\{oferta\}\}/g, lead.oferta ?? "não especificado");
    return `${t}${ctxBlock}${roteiroBlock}`;
  }

  const base = `Você é um agente de voz da ${empresa}.

Contexto da ligação:
- Nome do contato: ${lead.nome ?? "cliente"}
- Empresa: ${lead.empresa ?? "não informada"}
- Cargo: ${lead.cargo ?? "não informado"}
- Origem do lead: ${lead.origem ?? "não informada"}
- Objetivo: ${lead.objetivo ?? "apresentar a empresa e verificar interesse"}
- Produto/oferta: ${lead.oferta ?? "não especificado"}

Sua missão:
1. Cumprimente de forma breve e natural.
2. Confirme se está falando com ${lead.nome ?? "a pessoa indicada"}.
3. Explique em uma frase o motivo da ligação.
4. Faça no máximo 2 perguntas.
5. Se houver interesse, confirme o melhor próximo passo.
6. Se não houver interesse, respeite imediatamente.
7. Se o cliente mencionar informações relevantes (orçamento, preferências, objeções), chame salvar_informacao_cliente.
8. Ao encerrar, chame salvar_resultado_ligacao.

Estilo:
- Português brasileiro coloquial e natural.
- Frases curtas — no máximo 2 frases por turno.
- Nunca fale como robô; não mencione que está seguindo um script.
- Nunca invente dados.
- Não pressione a pessoa.
- Se a pessoa pedir para não ligar mais, classifique proxima_acao como "nao_contatar".`;

  const full = ctxBlock ? `${ctxBlock.trim()}\n\n${base}` : base;
  return roteiroBlock ? `${full}${roteiroBlock}` : full;
}

/**
 * Converte o objeto `roteiro` do agente em um bloco de texto para o prompt.
 * Segue as melhores práticas de mercado (Vapi, Bland, Retell):
 * abertura → qualificação → apresentação → objeções → CTA → encerramento → voicemail
 */
function buildRoteiroBlock(roteiro, lead) {
  if (!roteiro || typeof roteiro !== "object") return "";

  const r = roteiro;
  const nome = lead?.nome ?? "cliente";
  const lines = ["\n\n═══ ROTEIRO ESTRUTURADO ═══"];

  if (r.abertura) {
    lines.push(`\n[ABERTURA] — Hook inicial (máx. 15 segundos de fala):\n${interpolate(r.abertura, lead)}`);
  }

  if (Array.isArray(r.qualificacao) && r.qualificacao.length) {
    lines.push(`\n[QUALIFICAÇÃO] — Faça estas perguntas (escolha 1-2, não todas de uma vez):`);
    r.qualificacao.forEach((q, i) => lines.push(`  ${i + 1}. ${q}`));
  }

  if (r.apresentacao) {
    lines.push(`\n[APRESENTAÇÃO] — Adapte ao contexto do ${nome}:\n${interpolate(r.apresentacao, lead)}`);
  }

  if (Array.isArray(r.objecoes) && r.objecoes.length) {
    lines.push(`\n[OBJEÇÕES] — Respostas para objeções comuns:`);
    r.objecoes.forEach(({ objecao, resposta }) => {
      if (objecao && resposta) {
        lines.push(`  Se disser "${objecao}":\n    → ${resposta}`);
      }
    });
  }

  if (r.cta) {
    lines.push(`\n[CTA] — Chamada para ação clara:\n${interpolate(r.cta, lead)}`);
  }

  if (r.encerramento) {
    lines.push(`\n[ENCERRAMENTO]:\n${interpolate(r.encerramento, lead)}`);
  }

  if (r.voicemail) {
    lines.push(`\n[VOICEMAIL] — Se cair na caixa postal:\n${interpolate(r.voicemail, lead)}`);
  }

  lines.push("\n═══════════════════════════");
  return lines.join("\n");
}

function interpolate(text, lead) {
  if (!text || !lead) return text ?? "";
  return text
    .replace(/\{\{nome\}\}/g, lead.nome ?? "cliente")
    .replace(/\{\{empresa\}\}/g, lead.empresa ?? "não informada")
    .replace(/\{\{cargo\}\}/g, lead.cargo ?? "não informado")
    .replace(/\{\{oferta\}\}/g, lead.oferta ?? "não especificado")
    .replace(/\{\{objetivo\}\}/g, lead.objetivo ?? "");
}
