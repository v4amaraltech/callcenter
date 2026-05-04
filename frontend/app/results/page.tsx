"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { resultsApi, type CallResult, type Transcript } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { interesseBadge, humorBadge, proximo } from "@/lib/badges";
import { ChevronRight } from "lucide-react";

export default function ResultsPage() {
  const [interesse, setInteresse] = useState<string>("all");
  const [humor, setHumor] = useState<string>("all");
  const [proxima, setProxima] = useState<string>("all");
  const [selected, setSelected] = useState<CallResult | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loadingT, setLoadingT] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["results", interesse, humor, proxima],
    queryFn: () => resultsApi.list({
      ...(interesse !== "all" ? { interesse } : {}),
      ...(humor !== "all" ? { humor } : {}),
      ...(proxima !== "all" ? { proxima_acao: proxima } : {}),
    }),
  });

  async function openResult(r: CallResult) {
    setSelected(r);
    setLoadingT(true);
    try {
      const t = await resultsApi.transcripts(r.call_sid);
      setTranscripts(t);
    } finally {
      setLoadingT(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ligações</h1>

      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Interesse", state: interesse, set: (v: string | null) => setInteresse(v ?? "all"), opts: ["alto","medio","baixo","sem_interesse","incerto"] },
          { label: "Humor", state: humor, set: (v: string | null) => setHumor(v ?? "all"), opts: ["positivo","neutro","negativo","irritado","incerto"] },
          { label: "Próxima ação", state: proxima, set: (v: string | null) => setProxima(v ?? "all"), opts: ["enviar_whatsapp","enviar_email","agendar_reuniao","nao_contatar","revisar_manualmente"] },
        ].map(({ label, state, set, opts }) => (
          <Select key={label} value={state} onValueChange={set}>
            <SelectTrigger className="w-44"><SelectValue placeholder={label} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({label})</SelectItem>
              {opts.map(o => <SelectItem key={o} value={o}>{o.replace(/_/g," ")}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["Lead","Interesse","Humor","Próxima ação","Resumo","Data",""].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Carregando…</td></tr>
            ) : data?.data?.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{r.leads?.nome ?? r.lead_id ?? "—"}</td>
                <td className="px-4 py-3"><Badge variant="outline" className={interesseBadge(r.interesse)}>{r.interesse}</Badge></td>
                <td className="px-4 py-3"><Badge variant="outline" className={humorBadge(r.humor)}>{r.humor}</Badge></td>
                <td className="px-4 py-3"><Badge variant="outline">{proximo(r.proxima_acao)}</Badge></td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{r.resumo}</td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(r.criado_em).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3">
                  <Button size="icon" variant="ghost" onClick={() => openResult(r)}><ChevronRight className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.leads?.nome ?? "Detalhes da ligação"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Interesse</p>
                  <Badge variant="outline" className={`mt-1 ${interesseBadge(selected.interesse)}`}>{selected.interesse}</Badge>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Humor</p>
                  <Badge variant="outline" className={`mt-1 ${humorBadge(selected.humor)}`}>{selected.humor}</Badge>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Próxima ação</p>
                  <p className="font-medium mt-1">{proximo(selected.proxima_acao)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Resumo</p>
                <p>{selected.resumo}</p>
              </div>

              <div>
                <p className="font-semibold mb-3">Transcrição</p>
                {loadingT ? (
                  <p className="text-gray-400">Carregando transcrição…</p>
                ) : transcripts.length === 0 ? (
                  <p className="text-gray-400">Sem transcrição disponível</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {transcripts.map((t) => (
                      <div key={t.id} className={`flex gap-2 ${t.role === "agent" ? "justify-start" : "justify-end"}`}>
                        <div className={`rounded-2xl px-3 py-2 max-w-[80%] ${t.role === "agent" ? "bg-indigo-50 text-indigo-900" : "bg-gray-100 text-gray-800"}`}>
                          <span className="text-[10px] font-medium opacity-60 block mb-0.5">{t.role === "agent" ? "Agente" : "Cliente"}</span>
                          {t.texto}
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
