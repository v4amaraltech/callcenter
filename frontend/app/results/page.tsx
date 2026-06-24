"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { resultsApi, agentsApi, type CallResult } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { interesseBadge, humorBadge, proximo } from "@/lib/badges";
import { ChevronRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

type Bubble = { role: "user" | "agent"; texto: string; ts: string; ts_end?: string };

export default function ResultsPage() {
  const router = useRouter();
  const [interesse, setInteresse] = useState<string>("todos");
  const [humor, setHumor] = useState<string>("todos");
  const [proxima, setProxima] = useState<string>("todos");
  const [agentFilter, setAgentFilter] = useState<string>("todos");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;
  const [selected, setSelected] = useState<CallResult | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [loadingT, setLoadingT] = useState(false);

  const { data: agentsList } = useQuery({
    queryKey: ["agents", "for-results"],
    queryFn: () => agentsApi.list(false),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["results", interesse, humor, proxima, agentFilter, page],
    queryFn: () =>
      resultsApi.list({
        ...(interesse !== "todos" ? { interesse } : {}),
        ...(humor !== "todos" ? { humor } : {}),
        ...(proxima !== "todos" ? { proxima_acao: proxima } : {}),
        ...(agentFilter !== "todos" ? { agent_id: agentFilter } : {}),
        page: String(page),
        limit: String(PAGE_SIZE),
      }),
  });

  async function openResult(r: CallResult) {
    setSelected(r);
    setLoadingT(true);
    try {
      const c = await resultsApi.conversation(r.call_sid);
      setBubbles(c.bubbles ?? []);
    } catch {
      setBubbles([]);
    } finally {
      setLoadingT(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Operação / Ligações"
        title="Ligações"
        description="Histórico completo de chamadas com transcrições e análise de interesse."
      />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-3 flex-wrap">
        <Select value={agentFilter} onValueChange={(v) => setAgentFilter(v ?? "todos")}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filtrar por agente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os agentes</SelectItem>
            {agentsList?.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {[
          {
            label: "Interesse",
            state: interesse,
            set: (v: string | null) => setInteresse(v ?? "todos"),
            opts: ["alto", "medio", "baixo", "sem_interesse", "incerto"],
          },
          {
            label: "Humor",
            state: humor,
            set: (v: string | null) => setHumor(v ?? "todos"),
            opts: ["positivo", "neutro", "negativo", "irritado", "incerto"],
          },
          {
            label: "Próxima ação",
            state: proxima,
            set: (v: string | null) => setProxima(v ?? "todos"),
            opts: ["enviar_whatsapp", "enviar_email", "agendar_reuniao", "nao_contatar", "revisar_manualmente"],
          },
        ].map(({ label, state, set, opts }) => (
          <Select key={label} value={state} onValueChange={set}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder={`Filtrar por ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os valores</SelectItem>
              {opts.map((o) => (
                <SelectItem key={o} value={o}>
                  {o.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="overflow-hidden rounded-lg bg-card card-elevated"
      >
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {["Lead", "Telefone", "Agente", "Interesse", "Humor", "Próxima ação", "Resumo", "Data/Hora", ""].map((h) => (
                <th key={h} className="h-12 px-4 text-left align-middle text-xs font-medium text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-muted-foreground">
                  Nenhuma ligação ainda
                </td>
              </tr>
            ) : (
              data?.data?.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/50">
                  <td className="p-4 font-medium text-foreground">{r.leads?.nome ?? r.lead_id ?? "—"}</td>
                  <td className="p-4 text-sm text-muted-foreground">{r.leads?.telefone ?? "—"}</td>
                  <td className="p-4 text-sm text-muted-foreground">{r.agents?.nome ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={interesseBadge(r.interesse)}>
                      {r.interesse}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={humorBadge(r.humor)}>
                      {r.humor}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {proximo(r.proxima_acao)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{r.resumo}</td>
                  <td className="px-4 py-3 text-muted-foreground text-[12px] whitespace-nowrap">
                    {new Date(r.criado_em).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => void openResult(r)} className="w-8 h-8 hover:bg-accent" title="Pré-visualizar">
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => router.push(`/results/${r.id}`)} className="w-8 h-8 hover:bg-accent" title="Ver documentação completa">
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Paginação */}
        {(data?.count ?? 0) > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, data?.count ?? 0)} de {data?.count ?? 0} ligações
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-7 px-2 text-xs">
                ← Anterior
              </Button>
              <span className="px-2 text-xs text-muted-foreground">Página {page} de {Math.ceil((data?.count ?? 0) / PAGE_SIZE)}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * PAGE_SIZE >= (data?.count ?? 0)} className="h-7 px-2 text-xs">
                Próxima →
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selected?.leads?.nome ?? "Detalhes da ligação"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                {selected.agents?.nome && (
                  <span>Agente: <span className="text-foreground">{selected.agents.nome}</span></span>
                )}
                {selected.leads?.telefone && (
                  <span>Telefone: <span className="text-foreground">{selected.leads.telefone}</span></span>
                )}
                <span>Data: <span className="text-foreground">{new Date(selected.criado_em).toLocaleString("pt-BR")}</span></span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Interesse",
                    badge: (
                      <Badge variant="secondary" className={interesseBadge(selected.interesse)}>
                        {selected.interesse}
                      </Badge>
                    ),
                  },
                  {
                    label: "Humor",
                    badge: (
                      <Badge variant="secondary" className={humorBadge(selected.humor)}>
                        {selected.humor}
                      </Badge>
                    ),
                  },
                  {
                    label: "Próxima ação",
                    badge: <p className="font-medium text-foreground mt-1">{proximo(selected.proxima_acao)}</p>,
                  },
                ].map(({ label, badge }) => (
                  <div key={label} className="bg-muted rounded-lg p-3 border border-border">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
                    <div className="mt-1">{badge}</div>
                  </div>
                ))}
              </div>

              <div className="bg-muted rounded-lg p-3 border border-border">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Resumo</p>
                <p className="text-foreground">{selected.resumo}</p>
              </div>

              <div>
                <p className="font-medium text-foreground mb-3">Conversa</p>
                {loadingT ? (
                  <p className="text-muted-foreground">Carregando transcrição…</p>
                ) : bubbles.length === 0 ? (
                  <p className="text-muted-foreground">Sem transcrição disponível</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {bubbles.map((t, i) => (
                      <div key={`${t.ts}-${i}`} className={`flex ${t.role === "agent" ? "justify-start" : "justify-end"}`}>
                        <div
                          className={`rounded-xl px-3 py-2 max-w-[85%] text-sm ${
                            t.role === "agent"
                              ? "bg-primary/10 text-foreground border border-primary/20"
                              : "bg-muted text-foreground border border-border"
                          }`}
                        >
                          <span className="text-[10px] font-medium opacity-60 block mb-0.5">
                            {t.role === "agent" ? "Agente" : "Cliente"}
                          </span>
                          <p className="whitespace-pre-wrap">{t.texto}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
