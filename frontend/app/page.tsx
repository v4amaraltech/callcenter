"use client";
import { useQuery } from "@tanstack/react-query";
import { statsApi, resultsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhoneCall, TrendingUp, Users, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { interesseBadge, proximo } from "@/lib/badges";

export default function Dashboard() {
  const { data: summary } = useQuery({ queryKey: ["stats-summary"], queryFn: statsApi.summary });
  const { data: chart } = useQuery({ queryKey: ["stats-date"], queryFn: () => statsApi.byDate() });
  const { data: recent } = useQuery({ queryKey: ["results-recent"], queryFn: () => resultsApi.list({ limit: "10" }) });

  const cards = [
    { label: "Ligações hoje", value: summary?.ligacoes_hoje ?? "—", icon: PhoneCall, color: "text-blue-600" },
    { label: "Total de ligações", value: summary?.total_ligacoes ?? "—", icon: Users, color: "text-gray-600" },
    { label: "Taxa interesse alto", value: summary ? `${summary.taxa_interesse_alto}%` : "—", icon: TrendingUp, color: "text-green-600" },
    { label: "Taxa de conversão", value: summary ? `${summary.taxa_conversao}%` : "—", icon: Zap, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-3xl font-bold mt-1">{value}</p>
                </div>
                <Icon className={`w-5 h-5 mt-1 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Ligações por dia</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chart ?? []}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="alto" stroke="#22c55e" strokeWidth={2} dot={false} name="Alto interesse" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ligações recentes</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500 text-left">
                <th className="pb-2 font-medium">Lead</th>
                <th className="pb-2 font-medium">Interesse</th>
                <th className="pb-2 font-medium">Próxima ação</th>
                <th className="pb-2 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {recent?.data?.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2">{r.leads?.nome ?? r.lead_id ?? "—"}</td>
                  <td className="py-2"><Badge variant="outline" className={interesseBadge(r.interesse)}>{r.interesse}</Badge></td>
                  <td className="py-2"><Badge variant="outline">{proximo(r.proxima_acao)}</Badge></td>
                  <td className="py-2 text-gray-400">{new Date(r.criado_em).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
