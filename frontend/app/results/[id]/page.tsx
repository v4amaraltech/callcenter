"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { resultsApi, leadsApi, analysisApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { interesseBadge, humorBadge, statusBadge, proximo } from "@/lib/badges";
import {
  ArrowLeft,
  Phone,
  User,
  Building2,
  Bot,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  TrendingUp,
  FileText,
  Zap,
  Target,
  AlertCircle,
  ChevronRight,
  Flame,
  ThumbsUp,
  ThumbsDown,
  Star,
  BarChart2,
  ShieldAlert,
  Lightbulb,
  Tag,
} from "lucide-react";

type Bubble = { role: "user" | "agent"; texto: string; ts: string; ts_end?: string };

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function estimateDuration(bubbles: Bubble[]): number | null {
  if (!bubbles.length) return null;
  const first = bubbles[0]?.ts;
  const last = bubbles[bubbles.length - 1]?.ts_end ?? bubbles[bubbles.length - 1]?.ts;
  if (!first || !last) return null;
  return Math.round((new Date(last).getTime() - new Date(first).getTime()) / 1000);
}

function wordCount(bubbles: Bubble[], role: "user" | "agent") {
  return bubbles
    .filter((b) => b.role === role)
    .reduce((acc, b) => acc + b.texto.split(/\s+/).filter(Boolean).length, 0);
}

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  contactado: "Contactado",
  convertido: "Convertido",
  nao_contatar: "Não contatar",
  arquivado: "Arquivado",
};

const PROXIMA_LABELS: Record<string, string> = {
  enviar_whatsapp: "Enviar WhatsApp",
  enviar_email: "Enviar E-mail",
  agendar_reuniao: "Agendar Reunião",
  nao_contatar: "Não Contatar",
  revisar_manualmente: "Revisão Manual",
};

const PROXIMA_ICONS: Record<string, React.ElementType> = {
  enviar_whatsapp: MessageSquare,
  enviar_email: FileText,
  agendar_reuniao: Calendar,
  nao_contatar: XCircle,
  revisar_manualmente: AlertCircle,
};

// ── Helpers de análise ────────────────────────────────────────────────────────

const TEMP_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  quente:  { label: "Quente",  color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",    icon: Flame },
  morno:   { label: "Morno",   color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800", icon: Flame },
  frio:    { label: "Frio",    color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",  icon: Flame },
  gelado:  { label: "Gelado",  color: "text-slate-500 bg-muted border-border",   icon: Flame },
};

const SENT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  positivo: { label: "Positivo", icon: ThumbsUp,   color: "text-emerald-600" },
  neutro:   { label: "Neutro",   icon: ThumbsUp,   color: "text-amber-500" },
  negativo: { label: "Negativo", icon: ThumbsDown, color: "text-red-500" },
};

function ScoreBar({ score, max = 10 }: { score: number | null; max?: number }) {
  if (score == null) return <span className="text-muted-foreground text-sm">—</span>;
  const pct = (score / max) * 100;
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold tabular-nums">{score}</span>
      <span className="text-xs text-muted-foreground">/{max}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StarRating({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= value ? "text-amber-400 fill-amber-400" : "text-muted"}`} />
      ))}
    </div>
  );
}

import type { CallAnalysis } from "@/lib/api";

function AnalysisPanel({ analysis, loading }: { analysis?: CallAnalysis; loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            Análise Automática pela IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-lg bg-muted" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          <BarChart2 className="h-6 w-6 mx-auto mb-2 opacity-40" />
          Análise IA ainda sendo processada. Disponível em instantes após a ligação.
        </CardContent>
      </Card>
    );
  }

  const tempCfg = analysis.temperatura ? TEMP_CONFIG[analysis.temperatura] : null;
  const TempIcon = tempCfg?.icon ?? Flame;
  const sentCfg = analysis.sentimento ? SENT_CONFIG[analysis.sentimento] : null;
  const SentIcon = sentCfg?.icon ?? ThumbsUp;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-primary" />
          Análise Automática pela IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Métricas principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Qualidade</p>
            <ScoreBar score={analysis.qualidade_score} />
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Aderência ao Roteiro</p>
            <ScoreBar score={analysis.aderencia_roteiro} />
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Temperatura</p>
            {tempCfg ? (
              <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full border ${tempCfg.color}`}>
                <TempIcon className="h-3.5 w-3.5" />
                {tempCfg.label}
              </span>
            ) : <span className="text-muted-foreground text-sm">—</span>}
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Satisfação estimada</p>
            <StarRating value={analysis.satisfacao} />
          </div>
        </div>

        {/* Sentimento + resumo executivo */}
        <div className="grid md:grid-cols-2 gap-4">
          {sentCfg && (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Sentimento do cliente</p>
              <p className={`flex items-center gap-2 font-semibold ${sentCfg.color}`}>
                <SentIcon className="h-4 w-4" />
                {sentCfg.label}
                {analysis.confianca_sentimento != null && (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({Math.round(analysis.confianca_sentimento * 100)}% confiança)
                  </span>
                )}
              </p>
            </div>
          )}
          {analysis.resumo_executivo && (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Resumo executivo</p>
              <p className="text-sm text-foreground leading-relaxed">{analysis.resumo_executivo}</p>
            </div>
          )}
        </div>

        {/* Sinais de compra + objeções */}
        <div className="grid md:grid-cols-2 gap-4">
          {analysis.sinais_compra.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1.5">
                <ThumbsUp className="h-3.5 w-3.5" /> Sinais de compra
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.sinais_compra.map((s, i) => (
                  <span key={i} className="rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs px-2.5 py-1">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {analysis.objecoes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" /> Objeções detectadas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.objecoes.map((o, i) => (
                  <span key={i} className="rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs px-2.5 py-1">
                    {o}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tópicos + pontos fortes + pontos de melhoria */}
        <div className="grid md:grid-cols-3 gap-4">
          {analysis.topicos.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Tópicos abordados
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.topicos.map((t, i) => (
                  <span key={i} className="rounded-full bg-muted border border-border text-muted-foreground text-xs px-2.5 py-1">{t}</span>
                ))}
              </div>
            </div>
          )}
          {analysis.pontos_fortes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" /> Pontos fortes
              </p>
              <ul className="space-y-1">
                {analysis.pontos_fortes.map((p, i) => (
                  <li key={i} className="text-xs text-foreground flex gap-1.5">
                    <span className="text-emerald-500 mt-0.5">✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.pontos_melhoria.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" /> Pontos de melhoria
              </p>
              <ul className="space-y-1">
                {analysis.pontos_melhoria.map((p, i) => (
                  <li key={i} className="text-xs text-foreground flex gap-1.5">
                    <span className="text-amber-500 mt-0.5">→</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CallDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: result, isLoading: loadingResult } = useQuery({
    queryKey: ["result", id],
    queryFn: () => resultsApi.get(id),
    enabled: !!id,
  });

  const { data: conversation, isLoading: loadingTranscript } = useQuery({
    queryKey: ["conversation", result?.call_sid],
    queryFn: () => resultsApi.conversation(result!.call_sid),
    enabled: !!result?.call_sid,
  });

  const { data: leadDetail } = useQuery({
    queryKey: ["lead-detail", result?.lead_id],
    queryFn: () => leadsApi.get(result!.lead_id),
    enabled: !!result?.lead_id,
  });

  const { data: analysis, isLoading: loadingAnalysis } = useQuery({
    queryKey: ["call-analysis", id],
    queryFn: () => analysisApi.get(id),
    enabled: !!id,
    retry: false,
  });

  if (loadingResult) {
    return (
      <div className="page-shell">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-40 rounded-xl bg-muted" />
          <div className="h-64 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="page-shell flex flex-col items-center justify-center py-24 gap-3">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Ligação não encontrada.</p>
        <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  const bubbles: Bubble[] = conversation?.bubbles ?? [];
  const duration = estimateDuration(bubbles);
  const wordsUser = wordCount(bubbles, "user");
  const wordsAgent = wordCount(bubbles, "agent");
  const totalWords = wordsUser + wordsAgent;
  const ProximaIcon = PROXIMA_ICONS[result.proxima_acao] ?? ChevronRight;

  // Extrair pontos-chave da transcrição (falas mais longas de cada lado)
  const keyMomentsUser = bubbles
    .filter((b) => b.role === "user" && b.texto.split(/\s+/).length > 8)
    .sort((a, b) => b.texto.length - a.texto.length)
    .slice(0, 3);

  const keyMomentsAgent = bubbles
    .filter((b) => b.role === "agent" && b.texto.split(/\s+/).length > 8)
    .sort((a, b) => b.texto.length - a.texto.length)
    .slice(0, 3);

  return (
    <div className="page-shell gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/results")} className="gap-1.5 text-muted-foreground hover:text-foreground px-2">
          <ArrowLeft className="h-4 w-4" />
          Ligações
        </Button>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm text-foreground font-medium truncate max-w-xs">
          {result.leads?.nome ?? "Ligação"}
        </span>
      </div>

      {/* Header hero */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-foreground">{result.leads?.nome ?? "Lead"}</h1>
            <Badge variant="secondary" className={interesseBadge(result.interesse)}>
              {result.interesse}
            </Badge>
            <Badge variant="secondary" className={humorBadge(result.humor)}>
              {result.humor}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {result.leads?.empresa && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {result.leads.empresa}
              </span>
            )}
            {result.leads?.telefone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {result.leads.telefone}
              </span>
            )}
            {result.agents?.nome && (
              <span className="flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5" />
                {result.agents.nome}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(result.criado_em).toLocaleString("pt-BR")}
            </span>
            {duration !== null && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(duration)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border ${
            result.confirmado
              ? "bg-green-500/10 text-green-600 border-green-500/20"
              : "bg-muted text-muted-foreground border-border"
          }`}>
            {result.confirmado ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {result.confirmado ? "Confirmado" : "Não confirmado"}
          </div>
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border ${
            result.pessoa_correta
              ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
              : "bg-muted text-muted-foreground border-border"
          }`}>
            <User className="h-4 w-4" />
            {result.pessoa_correta ? "Pessoa certa" : "Pessoa errada"}
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3 lg:col-span-3 lg:grid-cols-4">
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Interesse</p>
              <Badge variant="secondary" className={`${interesseBadge(result.interesse)} text-base px-2 py-0.5`}>
                {result.interesse}
              </Badge>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Humor</p>
              <Badge variant="secondary" className={`${humorBadge(result.humor)} text-base px-2 py-0.5`}>
                {result.humor}
              </Badge>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Duração</p>
              <p className="text-xl font-semibold text-foreground">
                {duration !== null ? formatDuration(duration) : "—"}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Palavras trocadas</p>
              <p className="text-xl font-semibold text-foreground">{totalWords > 0 ? totalWords : "—"}</p>
              {totalWords > 0 && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {wordsAgent} agente · {wordsUser} cliente
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Análise IA — full-width acima das colunas */}
        <div className="lg:col-span-3">
          <AnalysisPanel analysis={analysis} loading={loadingAnalysis} />
        </div>

        {/* Coluna esquerda */}
        <div className="space-y-4 lg:col-span-2">
          {/* Resumo da IA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Resumo gerado pela IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">
                {result.resumo || <span className="text-muted-foreground italic">Sem resumo disponível.</span>}
              </p>
            </CardContent>
          </Card>

          {/* Pontos-chave */}
          {(keyMomentsUser.length > 0 || keyMomentsAgent.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Pontos-chave da conversa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {keyMomentsAgent.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-2">
                      Agente
                    </p>
                    <div className="space-y-2">
                      {keyMomentsAgent.map((b, i) => (
                        <div key={i} className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2 text-sm text-foreground">
                          "{b.texto}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {keyMomentsUser.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Cliente
                    </p>
                    <div className="space-y-2">
                      {keyMomentsUser.map((b, i) => (
                        <div key={i} className="rounded-lg bg-muted border border-border px-3 py-2 text-sm text-foreground">
                          "{b.texto}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transcrição completa */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Transcrição completa
                {bubbles.length > 0 && (
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    {bubbles.length} turnos
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTranscript ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse h-12 rounded-lg bg-muted" />
                  ))}
                </div>
              ) : bubbles.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  Transcrição não disponível para esta ligação.
                </p>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {bubbles.map((b, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${b.role === "agent" ? "justify-start" : "justify-end"}`}
                    >
                      {b.role === "agent" && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
                          <Bot className="h-3 w-3 text-primary" />
                        </div>
                      )}
                      <div
                        className={`rounded-xl px-3 py-2 max-w-[82%] text-sm ${
                          b.role === "agent"
                            ? "bg-primary/8 border border-primary/15 text-foreground"
                            : "bg-muted border border-border text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-semibold opacity-60">
                            {b.role === "agent" ? "Agente" : "Cliente"}
                          </span>
                          {b.ts && (
                            <span className="text-[10px] opacity-40">
                              {new Date(b.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{b.texto}</p>
                      </div>
                      {b.role === "user" && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted border border-border mt-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita */}
        <div className="space-y-4">
          {/* Próxima ação */}
          <Card className="border-primary/20 bg-primary/3">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Próxima ação recomendada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg bg-card border border-border px-3 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ProximaIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {PROXIMA_LABELS[result.proxima_acao] ?? result.proxima_acao}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Definido pela IA com base na conversa
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do lead */}
          {leadDetail && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Lead
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  ["Nome", leadDetail.nome],
                  ["Empresa", leadDetail.empresa],
                  ["Cargo", leadDetail.cargo],
                  ["Telefone", leadDetail.telefone],
                  ["Origem", leadDetail.origem],
                  ["Tentativas", String(leadDetail.tentativas)],
                  ["Cadastro", leadDetail.criado_em ? new Date(leadDetail.criado_em).toLocaleDateString("pt-BR") : undefined],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">{label}</span>
                      <span className="text-foreground text-right">{value}</span>
                    </div>
                  ))}
                <div className="flex justify-between gap-2 pt-1">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary" className={statusBadge(leadDetail.status)}>
                    {STATUS_LABELS[leadDetail.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações coletadas */}
          {leadDetail?.info_chave && leadDetail.info_chave.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Informações coletadas pela IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leadDetail.info_chave.map((item) => (
                  <div key={item.id} className="rounded-lg bg-muted px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">{item.chave}: </span>
                    <span className="text-muted-foreground">{item.valor}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Detalhes técnicos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Detalhes técnicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground font-mono">
              <div className="flex justify-between gap-2">
                <span>Call SID</span>
                <span className="text-right truncate max-w-[140px]" title={result.call_sid}>{result.call_sid}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Result ID</span>
                <span>{result.id}</span>
              </div>
              {result.agent_id && (
                <div className="flex justify-between gap-2">
                  <span>Agent ID</span>
                  <span className="text-right truncate max-w-[140px]" title={result.agent_id}>{result.agent_id.slice(0, 8)}…</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
