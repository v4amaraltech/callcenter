"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignsApi, type Campaign } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Pencil, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Campanhas</h1>
          <p className="text-[#666] text-sm mt-1">{campaigns?.length ?? 0} campanhas</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setOpenForm(true); }}
          className="bg-[#ff4400] hover:bg-[#e03d00] text-white border-0">
          <Plus className="w-4 h-4 mr-1.5" /> Nova campanha
        </Button>
      </motion.div>

      {isLoading && <p className="text-[#555]">Carregando…</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {campaigns?.map((c, i) => (
          <motion.div key={c.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <Card className="bg-[#111] border-[#1e1e1e] hover:border-[#2a2a2a] transition-colors h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-[15px] text-white font-medium">{c.nome}</CardTitle>
                  <Badge variant="outline" className={c.ativo
                    ? "text-green-400 border-green-500/30 bg-green-500/10 shrink-0"
                    : "text-[#666] border-[#2a2a2a] shrink-0"}>
                    {c.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                {c.descricao && <p className="text-sm text-[#666] mt-1">{c.descricao}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                {c.objetivo && (
                  <p className="text-xs text-[#666]"><span className="text-[#888]">Objetivo:</span> {c.objetivo}</p>
                )}
                {c.oferta && (
                  <p className="text-xs text-[#666]"><span className="text-[#888]">Oferta:</span> {c.oferta}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1 bg-[#ff4400]/10 hover:bg-[#ff4400]/20 text-[#ff6633] border-[#ff4400]/20 border"
                    onClick={() => setConfirmDispatch(c)} disabled={!c.ativo}>
                    <Zap className="w-3 h-3 mr-1" /> Disparar
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => { setForm(c); setOpenForm(true); }}
                    className="border-[#2a2a2a] hover:bg-[#2a2a2a] text-[#888] w-8 h-8">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => remove.mutate(c.id!)}
                    className="border-[#2a2a2a] hover:bg-red-500/10 text-red-500 w-8 h-8">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-md bg-[#111] border-[#2a2a2a]">
          <DialogHeader><DialogTitle className="text-white">{form.id ? "Editar campanha" : "Nova campanha"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { key: "nome", label: "Nome *", placeholder: "Campanha Outbound Q2" },
              { key: "descricao", label: "Descrição", placeholder: "Descrição da campanha" },
              { key: "objetivo", label: "Objetivo da ligação", placeholder: "confirmar interesse" },
              { key: "oferta", label: "Produto / oferta", placeholder: "Plano Pro" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label className="text-xs text-[#888]">{label}</Label>
                <Input value={(form as any)[key] ?? ""} placeholder={placeholder}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="mt-1 bg-[#1a1a1a] border-[#2a2a2a] text-[#ccc] placeholder:text-[#444]" />
              </div>
            ))}
            <div className="flex items-center gap-3 pt-1">
              <Switch checked={form.ativo ?? true} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} />
              <Label className="text-[#888] text-sm">Campanha ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)} className="border-[#2a2a2a] text-[#888] hover:text-white">Cancelar</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending || !form.nome}
              className="bg-[#ff4400] hover:bg-[#e03d00] text-white border-0">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDispatch} onOpenChange={o => !o && setConfirmDispatch(null)}>
        <DialogContent className="max-w-sm bg-[#111] border-[#2a2a2a]">
          <DialogHeader><DialogTitle className="text-white">Disparar campanha</DialogTitle></DialogHeader>
          <p className="text-sm text-[#888]">
            Vai iniciar ligações para todos os leads com status <span className="text-white font-medium">novo</span> ou{" "}
            <span className="text-white font-medium">contactado</span> na campanha{" "}
            <span className="text-[#ff6633] font-medium">{confirmDispatch?.nome}</span>. Confirma?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDispatch(null)} className="border-[#2a2a2a] text-[#888] hover:text-white">Cancelar</Button>
            <Button onClick={() => dispatch.mutate(confirmDispatch!.id!)} disabled={dispatch.isPending}
              className="bg-[#ff4400] hover:bg-[#e03d00] text-white border-0">
              {dispatch.isPending ? "Disparando…" : "Disparar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
