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

const MODELOS = ["gemini-3.1-flash-live-preview", "gemini-2.5-flash-live-preview"];
const VOZES = ["Kore", "Charon", "Fenrir", "Aoede", "Puck", "Leda", "Orus", "Zephyr"];

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

  if (isLoading) return <p className="text-gray-400 p-8">Carregando…</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Configurações do Bot</h1>

      <Card>
        <CardHeader>
          <CardTitle>Identidade</CardTitle>
          <CardDescription>Como o agente se apresenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome da empresa</Label>
            <Input value={form.empresa_nome ?? ""} onChange={e => set("empresa_nome", e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modelo e voz</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Modelo Gemini</Label>
            <Select value={form.modelo_gemini} onValueChange={v => set("modelo_gemini", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODELOS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Voz</Label>
            <Select value={form.voz} onValueChange={v => set("voz", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VOZES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comportamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Agente fala primeiro</Label>
              <p className="text-xs text-gray-500 mt-0.5">Quando ativo, o agente cumprimenta assim que a chamada conecta</p>
            </div>
            <Switch
              checked={form.quem_fala_primeiro === "agente"}
              onCheckedChange={v => set("quem_fala_primeiro", v ? "agente" : "usuario")}
            />
          </div>
          <div>
            <Label>Timeout da ligação (segundos)</Label>
            <Input
              type="number"
              min={30}
              max={600}
              value={form.timeout_segundos ?? 120}
              onChange={e => set("timeout_segundos", parseInt(e.target.value))}
              className="mt-1 w-32"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt template</CardTitle>
          <CardDescription>
            Deixe vazio para usar o padrão. Use variáveis: <code className="bg-gray-100 px-1 rounded text-xs">{"{{nome}}"}</code>{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">{"{{empresa}}"}</code>{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">{"{{cargo}}"}</code>{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">{"{{objetivo}}"}</code>{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">{"{{oferta}}"}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={12}
            placeholder="Deixe vazio para usar o prompt padrão…"
            value={form.prompt_template ?? ""}
            onChange={e => set("prompt_template", e.target.value)}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
        {save.isPending ? "Salvando…" : "Salvar configurações"}
      </Button>
    </div>
  );
}
