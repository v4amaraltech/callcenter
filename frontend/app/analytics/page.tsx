"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { statsApi, advancedStatsApi, agentsApi, exportUrl } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download, Flame, Star, TrendingUp, Users, Phone, CheckSquare,
  ShieldAlert, Target,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const TEMP_COLORS: Record<string, string> = {
  quente: "#ef4444",
  morno:  "#f59e0b",
  frio:   "#3b82f6",
  gelado: "#94a3b8",
};

const PERIOD_OPTIONS = [
  { value: "7d",  label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
];

function periodToDates(period: string): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [agentFilter, setAgentFilter] = useState("");

  const { from, to } = periodToDates(period);
  const agentParam = agentFilter && agentFilter !== "_all" ? agentFilter : undefined;

  const { data: agents } = useQuery({ queryKey: ["agents"], queryFn: () => agentsApi.list(true) });
  const { data: summary } = useQuery({
    queryKey: ["stats-summary", agentParam],
    queryFn: () => statsApi.summary({ agent_id: agentParam }),
  });
  const { data: byDate } = useQuery({
    queryKey: ["stats-by-date", from, to, agentParam],
    queryFn: () => statsApi.byDate({ from, to, agent_id: agentParam }),
  });
  const { data: byAgent } = useQuery({
    queryKey: ["stats-by-agent", from, to],
    queryFn: () => statsApi.byAgent({ from, to }),
  });
  const { data: quality } = useQuery({
    queryKey: ["stats-quality", agentParam, from, to],
    queryFn: () => advancedStatsApi.quality({ agent_id: agentParam, from, to }),
  });
  const { data: funnel } = useQuery({
    queryKey: ["stats-funnel", agentParam],
    queryFn: () => advancedStatsApi.funnel({ agent_id: agentParam }),
  });
  const { data: objections } = useQuery({
    queryKey: ["stats-objections", agentParam, from, to],
    queryFn: () => advancedStatsApi.objections({ agent_id: agentParam, from, to, limit: "10" }),
  });
  const { data: taskStats } = useQuery({
    queryKey: ["tasks-stats"],
    queryFn: () => advancedStatsApi.tasks(),
  });

  const tempData = (quality?.distribuicao_temperatura ?? []).map(t => ({
    name: t.temperatura.charAt(0).toUpperCase() + t.temperatura.slice(1),
    value: parseInt(t.total),
    fill: TEMP_COLORS[t.temperatura] ?? "#94a3b8",
  }));

  const funnelData = funnel ? [
    { name: "Novos",        value: funnel.novo,        fill: "#3b82f6" },
    { name: "Contactados",  value: funnel.contactado,  fill: "#f59e0b" },
    { name: "Convertidos",  value: funnel.convertido,  fill: "#10b981" },
    { name: "Não contatar", value: funnel.nao_contatar,fill: "#ef4444" },
  ] : [];

  const exportParams: Record<string, string> = {};
  if (agentParam) exportParams.agent_id = agentParam;
  exportParams.from = from;
  exportParams.to = to;

  return (
    <div className="page-shell gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow="Principal"
          title="Analytics"
          description="Métricas avançadas de ligações, qualidade e conversão"
        />
        <div className="flex flex-wrap gap-2 shrink-0">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={agentFilter || "_all"} onValueChange={v => setAgentFilter(v === "_all" ? "" : v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos os agentes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos os agentes</SelectItem>
              {agents?.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5"
            onClick={() => window.open(exportUrl("/export/results", exportParams), "_blank")}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Total de ligações", value: summary?.total_ligacoes ?? 0, icon: Phone, color: "text-primary" },
          { label: "Interesse alto %", value: `${summary?.taxa_interesse_alto ?? 0}%`, icon: TrendingUp, color: "text-emerald-600" },
          { label: "Qualidade média", value: quality?.qualidade_media ? `${parseFloat(quality.qualidade_media).toFixed(1)}/10` : "—", icon: Star, color: "text-amber-500" },
          { label: "Tasks pendentes", value: taskStats?.pendente ?? 0, icon: CheckSquare, color: "text-blue-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">{label}</p>
                <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos linha: evolução diária */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Evolução diária
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={byDate ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend iconType="circle" iconSize={8} />
              <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="alto" name="Alto interesse" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Grid: temperatura + funil */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" />
              Distribuição de temperatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tempData.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhuma análise disponível ainda</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={tempData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {tempData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Funil de leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" name="Leads" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de agentes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Ranking de agentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byAgent ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="agent_nome" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              <Bar dataKey="alto" name="Alto interesse" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Objeções mais comuns */}
      {(objections?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Objeções mais frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {objections?.map((o, i) => {
                const max = parseInt(objections[0]?.frequencia ?? "1");
                const pct = (parseInt(o.frequencia) / max) * 100;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums w-4 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm text-foreground truncate">{o.objecao}</p>
                        <span className="text-xs text-muted-foreground tabular-nums ml-2 shrink-0">{o.frequencia}×</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-red-500/70 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
