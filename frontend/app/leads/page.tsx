"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi, type Lead } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { statusBadge } from "@/lib/badges";
import { Phone, Plus, Trash2, Pencil, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo", contactado: "Contactado", convertido: "Convertido",
  nao_contatar: "Não contatar", arquivado: "Arquivado",
};

const EMPTY: Partial<Lead> = { id: "", nome: "", telefone: "", empresa: "", cargo: "", origem: "", objetivo: "", oferta: "", status: "novo" };

export default function LeadsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<Partial<Lead>>(EMPTY);
  const [openForm, setOpenForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [newInfo, setNewInfo] = useState({ chave: "", valor: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["leads", search, statusFilter],
    queryFn: () => leadsApi.list({
      ...(search ? { q: search } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    }),
  });

  const { data: detail } = useQuery({
    queryKey: ["lead-detail", selectedLead],
    queryFn: () => leadsApi.get(selectedLead!),
    enabled: !!selectedLead,
  });

  const save = useMutation({
    mutationFn: (l: Partial<Lead>) => l.id && data?.data?.find(x => x.id === l.id)
      ? leadsApi.update(l.id, l)
      : leadsApi.create(l),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); setOpenForm(false); toast.success("Lead salvo!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: leadsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); toast.success("Lead removido"); },
  });

  const call = useMutation({
    mutationFn: (id: string) => leadsApi.call(id),
    onSuccess: (d) => toast.success(`Ligação iniciada: ${d.callSid}`),
    onError: (e: Error) => toast.error(e.message),
  });

  const addInfo = useMutation({
    mutationFn: () => leadsApi.addInfo(selectedLead!, newInfo.chave, newInfo.valor),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lead-detail"] }); setNewInfo({ chave: "", valor: "" }); toast.success("Info salva"); },
  });

  function openCreate() { setForm(EMPTY); setOpenForm(true); }
  function openEdit(l: Lead) { setForm(l); setOpenForm(true); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Novo lead</Button>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Buscar por nome, empresa ou telefone…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["Nome", "Empresa", "Telefone", "Status", "Tentativas", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Carregando…</td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum lead encontrado</td></tr>
            ) : data?.data?.map((lead) => (
              <tr key={lead.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{lead.nome}</td>
                <td className="px-4 py-3 text-gray-500">{lead.empresa ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{lead.telefone}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={statusBadge(lead.status)}>{STATUS_LABELS[lead.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-400">{lead.tentativas}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" onClick={() => call.mutate(lead.id)} title="Ligar agora">
                      <Phone className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(lead)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(lead.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setSelectedLead(lead.id)}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.nome ? "Editar lead" : "Novo lead"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {[
              { key: "id", label: "ID único", placeholder: "lead_001" },
              { key: "nome", label: "Nome *", placeholder: "João Silva" },
              { key: "telefone", label: "Telefone *", placeholder: "+5511999999999" },
              { key: "empresa", label: "Empresa", placeholder: "TechCorp" },
              { key: "cargo", label: "Cargo", placeholder: "Diretor Comercial" },
              { key: "origem", label: "Origem", placeholder: "formulário web" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label className="text-xs mb-1">{label}</Label>
                <Input
                  placeholder={placeholder}
                  value={(form as Record<string, string>)[key] ?? ""}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="col-span-2">
              <Label className="text-xs mb-1">Objetivo da ligação</Label>
              <Input placeholder="confirmar interesse em receber proposta" value={form.objetivo ?? ""} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1">Produto / oferta</Label>
              <Input placeholder="Automação de atendimento" value={form.oferta ?? ""} onChange={e => setForm(f => ({ ...f, oferta: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail sheet */}
      <Sheet open={!!selectedLead} onOpenChange={o => !o && setSelectedLead(null)}>
        <SheetContent className="w-[420px] overflow-y-auto">
          <SheetHeader><SheetTitle>{detail?.nome}</SheetTitle></SheetHeader>
          {detail && (
            <div className="mt-4 space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <span className="font-medium text-gray-900">Empresa</span><span>{detail.empresa ?? "—"}</span>
                <span className="font-medium text-gray-900">Cargo</span><span>{detail.cargo ?? "—"}</span>
                <span className="font-medium text-gray-900">Telefone</span><span>{detail.telefone}</span>
                <span className="font-medium text-gray-900">Status</span><Badge variant="outline" className={statusBadge(detail.status)}>{STATUS_LABELS[detail.status]}</Badge>
                <span className="font-medium text-gray-900">Tentativas</span><span>{detail.tentativas}</span>
              </div>

              <div>
                <p className="font-semibold mb-2">Informações coletadas na ligação</p>
                {detail.info_chave?.length === 0 && <p className="text-gray-400">Nenhuma ainda</p>}
                <div className="space-y-1">
                  {detail.info_chave?.map(i => (
                    <div key={i.id} className="flex gap-2 bg-gray-50 rounded px-3 py-1">
                      <span className="font-medium text-gray-700">{i.chave}:</span>
                      <span className="text-gray-600">{i.valor}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="chave" value={newInfo.chave} onChange={e => setNewInfo(n => ({ ...n, chave: e.target.value }))} className="h-8 text-xs" />
                  <Input placeholder="valor" value={newInfo.valor} onChange={e => setNewInfo(n => ({ ...n, valor: e.target.value }))} className="h-8 text-xs" />
                  <Button size="sm" onClick={() => addInfo.mutate()}>+</Button>
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">Histórico de ligações</p>
                {detail.historico_ligacoes?.length === 0 && <p className="text-gray-400">Nenhuma ligação ainda</p>}
                <div className="space-y-2">
                  {detail.historico_ligacoes?.map(r => (
                    <div key={r.id} className="border rounded-lg px-3 py-2 space-y-1">
                      <div className="flex gap-2">
                        <Badge variant="outline" className={`text-xs ${interesseBadge(r.interesse)}`}>{r.interesse}</Badge>
                        <span className="text-gray-400 text-xs">{new Date(r.criado_em).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <p className="text-gray-600">{r.resumo}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function interesseBadge(i: string) {
  return { alto: "border-green-300 text-green-700", medio: "border-blue-300 text-blue-700", baixo: "border-yellow-300 text-yellow-700", sem_interesse: "border-red-300 text-red-700", incerto: "border-gray-300 text-gray-600" }[i] ?? "";
}
