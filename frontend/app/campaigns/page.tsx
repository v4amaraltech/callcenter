"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignsApi, leadsApi, type Campaign } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Pencil, Zap, Users } from "lucide-react";
import { toast } from "sonner";

const EMPTY: Partial<Campaign> = { nome: "", descricao: "", objetivo: "", oferta: "", ativo: true };

export default function CampaignsPage() {
  const qc = useQueryClient();
  const [openForm, setOpenForm] = useState(false);
  const [confirmDispatch, setConfirmDispatch] = useState<Campaign | null>(null);
  const [form, setForm] = useState<Partial<Campaign>>(EMPTY);

  const { data: campaigns, isLoading } = useQuery({ queryKey: ["campaigns"], queryFn: campaignsApi.list });

  const save = useMutation({
    mutationFn: (c: Partial<Campaign>) => c.id ? campaignsApi.update(c.id, c) : campaignsApi.create(c),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); setOpenForm(false); toast.success("Campanha salva!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: campaignsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); toast.success("Campanha removida"); },
  });

  const dispatch = useMutation({
    mutationFn: (id: string) => campaignsApi.dispatch(id),
    onSuccess: (d: any) => { toast.success(`${d.dispatched} ligações iniciadas!`); setConfirmDispatch(null); },
    onError: (e: Error) => { toast.error(e.message); setConfirmDispatch(null); },
  });

  function openEdit(c: Campaign) { setForm(c); setOpenForm(true); }
  function openCreate() { setForm(EMPTY); setOpenForm(true); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campanhas</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Nova campanha</Button>
      </div>

      {isLoading && <p className="text-gray-400">Carregando…</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {campaigns?.map((c) => (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{c.nome}</CardTitle>
                <Badge variant="outline" className={c.ativo ? "text-green-700 border-green-300 bg-green-50" : "text-gray-400"}>
                  {c.ativo ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              {c.descricao && <p className="text-sm text-gray-500 mt-1">{c.descricao}</p>}
            </CardHeader>
            <CardContent className="space-y-3">
              {c.objetivo && <p className="text-xs text-gray-500"><span className="font-medium">Objetivo:</span> {c.objetivo}</p>}
              {c.oferta && <p className="text-xs text-gray-500"><span className="font-medium">Oferta:</span> {c.oferta}</p>}
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1" onClick={() => setConfirmDispatch(c)} disabled={!c.ativo}>
                  <Zap className="w-3 h-3 mr-1" /> Disparar
                </Button>
                <Button size="icon" variant="outline" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="outline" onClick={() => remove.mutate(c.id!)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{form.id ? "Editar campanha" : "Nova campanha"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome ?? ""} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao ?? ""} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2} className="mt-1" />
            </div>
            <div>
              <Label>Objetivo da ligação</Label>
              <Input value={form.objetivo ?? ""} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Produto / oferta</Label>
              <Input value={form.oferta ?? ""} onChange={e => setForm(f => ({ ...f, oferta: e.target.value }))} className="mt-1" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.ativo ?? true} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} />
              <Label>Campanha ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending || !form.nome}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm dispatch dialog */}
      <Dialog open={!!confirmDispatch} onOpenChange={o => !o && setConfirmDispatch(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Disparar campanha</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">
            Vai iniciar ligações para todos os leads com status <strong>novo</strong> ou <strong>contactado</strong> na campanha <strong>{confirmDispatch?.nome}</strong>. Confirma?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDispatch(null)}>Cancelar</Button>
            <Button onClick={() => dispatch.mutate(confirmDispatch!.id!)} disabled={dispatch.isPending}>
              {dispatch.isPending ? "Disparando…" : "Disparar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
