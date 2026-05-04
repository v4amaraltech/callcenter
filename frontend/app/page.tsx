"use client";
import { useQuery } from "@tanstack/react-query";
import { statsApi, resultsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhoneCall, TrendingUp, Users, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { interesseBadge, proximo } from "@/lib/badges";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" as const } }),
};

export default function Dashboard() {
  const { data: summary } = useQuery({ queryKey: ["stats-summary"], queryFn: statsApi.summary });
  const { data: chart } = useQuery({ queryKey: ["stats-date"], queryFn: () => statsApi.byDate() });
  const { data: recent } = useQuery({ queryKey: ["results-recent"], queryFn: () => resultsApi.list({ limit: "10" }) });

  const cards = [
    { label: "Ligações hoje", value: summary?.ligacoes_hoje ?? "—", icon: PhoneCall, accent: "#ff4400" },
    { label: "Total de ligações", value: summary?.total_ligacoes ?? "—", icon: Users, accent: "#888" },
    { label: "Taxa interesse alto", value: summary ? `${summary.taxa_interesse_alto}%` : "—", icon: TrendingUp, accent: "#22c55e" },
    { label: "Taxa de conversão", value: summary ? `${summary.taxa_conversao}%` : "—", icon: Zap, accent: "#a855f7" },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="text-[#666] text-sm mt-1">Visão geral das ligações e resultados</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, accent }, i) => (
          <motion.div key={label} custom={i} variants={fadeUp} initial="hidden" animate="show">
            <Card className="bg-[#111] border-[#1e1e1e] hover:border-[#2a2a2a] transition-colors">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[12px] text-[#666] uppercase tracking-wide">{label}</p>
                    <p className="text-[28px] font-bold mt-1 leading-none text-white">{value}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}15` }}>
                    <Icon className="w-4 h-4" style={{ color: accent }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
        <Card className="bg-[#111] border-[#1e1e1e]">
          <CardHeader className="pb-4">
            <CardTitle className="text-[14px] font-medium text-[#aaa] uppercase tracking-wide">Ligações por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chart ?? []}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#555" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#555" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#aaa" }}
                />
                <Line type="monotone" dataKey="total" stroke="#ff4400" strokeWidth={2} dot={false} name="Total" />
                <Line type="monotone" dataKey="alto" stroke="#22c55e" strokeWidth={2} dot={false} name="Alto interesse" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
        <Card className="bg-[#111] border-[#1e1e1e]">
          <CardHeader className="pb-4">
            <CardTitle className="text-[14px] font-medium text-[#aaa] uppercase tracking-wide">Ligações recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e1e] text-[#555] text-left text-[11px] uppercase tracking-wide">
                  <th className="pb-3 font-medium">Lead</th>
                  <th className="pb-3 font-medium">Interesse</th>
                  <th className="pb-3 font-medium">Próxima ação</th>
                  <th className="pb-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {recent?.data?.map((r) => (
                  <tr key={r.id} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#161616] transition-colors">
                    <td className="py-3 text-[#ccc]">{r.leads?.nome ?? r.lead_id ?? "—"}</td>
                    <td className="py-3"><Badge variant="outline" className={interesseBadge(r.interesse)}>{r.interesse}</Badge></td>
                    <td className="py-3"><Badge variant="outline" className="border-[#2a2a2a] text-[#888]">{proximo(r.proxima_acao)}</Badge></td>
                    <td className="py-3 text-[#555] text-[12px]">{new Date(r.criado_em).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
                {!recent?.data?.length && (
                  <tr><td colSpan={4} className="py-8 text-center text-[#555] text-sm">Nenhuma ligação ainda</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
