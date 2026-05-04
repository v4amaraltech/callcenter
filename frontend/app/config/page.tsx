"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { configApi, type BotConfig } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";

const MODELOS = ["gemini-3.1-flash-live-preview", "gemini-2.5-flash-live-preview"];
const VOZES = ["Kore", "Charon", "Fenrir", "Aoede", "Puck", "Leda", "Orus", "Zephyr"];

const fade = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
});

export default function ConfigPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["bot-config"], queryFn: configApi.get });
  const [form, setForm] = useState<Partial<BotConfig>>({});

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: () => configApi.update(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bot-config"] }); toast.success("Configurações salvas!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  function set(key: keyof BotConfig, value: unknown) {
    setForm(f => ({ ...f, [key]: value }));
  }

  if (isLoading) return <p className="text-[#555] p-8">Carregando…</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div {...fade(0)}>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Configurações do Bot</h1>
        <p className="text-[#666] text-sm mt-1">Personalize o comportamento do agente de voz</p>
      </motion.div>

      <motion.div {...fade(1)}>
        <Card className="bg-[#111] border-[#1e1e1e]">
          <CardHeader>
            <CardTitle className="text-white text-base">Identidade</CardTitle>
            <CardDescription className="text-[#666]">Como o agente se apresenta</CardDescription>
          </CardHeader>
          <CardContent>
            <Label className="text-[#888] text-xs">Nome da empresa</Label>
            <Input value={form.empresa_nome ?? ""} onChange={e => set("empresa_nome", e.target.value)}
              className="mt-1 bg-[#1a1a1a] border-[#2a2a2a] text-[#ccc] placeholder:text-[#444]" />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...fade(2)}>
        <Card className="bg-[#111] border-[#1e1e1e]">
          <CardHeader>
            <CardTitle className="text-white text-base">Modelo e voz</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#888] text-xs">Modelo Gemini</Label>
              <Select value={form.modelo_gemini} onValueChange={v => set("modelo_gemini", v)}>
                <SelectTrigger className="mt-1 bg-[#1a1a1a] border-[#2a2a2a] text-[#ccc]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#161616] border-[#2a2a2a]">
                  {MODELOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#888] text-xs">Voz</Label>
              <Select value={form.voz} onValueChange={v => set("voz", v)}>
                <SelectTrigger className="mt-1 bg-[#1a1a1a] border-[#2a2a2a] text-[#ccc]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#161616] border-[#2a2a2a]">
                  {VOZES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...fade(3)}>
        <Card className="bg-[#111] border-[#1e1e1e]">
          <CardHeader>
            <CardTitle className="text-white text-base">Comportamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#ccc] text-sm font-medium">Agente fala primeiro</p>
                <p className="text-xs text-[#666] mt-0.5">O agente cumprimenta assim que a chamada conecta</p>
              </div>
              <Switch
                checked={form.quem_fala_primeiro === "agente"}
                onCheckedChange={v => set("quem_fala_primeiro", v ? "agente" : "usuario")}
              />
            </div>
            <div>
              <Label className="text-[#888] text-xs">Timeout da ligação (segundos)</Label>
              <Input type="number" min={30} max={600}
                value={form.timeout_segundos ?? 120}
                onChange={e => set("timeout_segundos", parseInt(e.target.value))}
                className="mt-1 w-32 bg-[#1a1a1a] border-[#2a2a2a] text-[#ccc]" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...fade(4)}>
        <Card className="bg-[#111] border-[#1e1e1e]">
          <CardHeader>
            <CardTitle className="text-white text-base">Prompt template</CardTitle>
            <CardDescription className="text-[#666]">
              Deixe vazio para usar o padrão. Variáveis:{" "}
              {["{{nome}}", "{{empresa}}", "{{cargo}}", "{{objetivo}}", "{{oferta}}"].map(v => (
                <code key={v} className="mx-0.5 bg-[#1e1e1e] px-1.5 py-0.5 rounded text-[11px] text-[#ff8855] border border-[#2a2a2a]">{v}</code>
              ))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea rows={12} placeholder="Deixe vazio para usar o prompt padrão…"
              value={form.prompt_template ?? ""}
              onChange={e => set("prompt_template", e.target.value)}
              className="font-mono text-sm bg-[#1a1a1a] border-[#2a2a2a] text-[#ccc] placeholder:text-[#444]" />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...fade(5)}>
        <Button onClick={() => save.mutate()} disabled={save.isPending}
          className="w-full bg-[#ff4400] hover:bg-[#e03d00] text-white border-0 h-11">
          {save.isPending ? "Salvando…" : "Salvar configurações"}
        </Button>
      </motion.div>
    </div>
  );
}
