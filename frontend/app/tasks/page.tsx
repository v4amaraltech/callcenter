"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api";
import type { Task } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Mail,
  Calendar,
  Phone,
  ClipboardList,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIPO_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  whatsapp:       { label: "WhatsApp",       icon: MessageSquare, color: "text-emerald-600" },
  email:          { label: "E-mail",          icon: Mail,         color: "text-blue-600" },
  reuniao:        { label: "Reunião",         icon: Calendar,     color: "text-purple-600" },
  ligar_novamente:{ label: "Ligar Novamente", icon: Phone,        color: "text-amber-600" },
  revisar:        { label: "Revisar",         icon: ClipboardList,color: "text-slate-600" },
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pendente:     { label: "Pendente",     className: "badge-warning" },
  em_andamento: { label: "Em andamento", className: "badge-info" },
  concluido:    { label: "Concluído",    className: "badge-success" },
  cancelado:    { label: "Cancelado",    className: "bg-muted text-muted-foreground" },
};

function formatPrazo(prazo: string | null | undefined) {
  if (!prazo) return null;
  const d = new Date(prazo);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const hrs = Math.round(diff / 3600000);

  if (diff < 0) return { label: "Atrasado", urgent: true };
  if (hrs < 2) return { label: "< 2 horas", urgent: true };
  if (hrs < 24) return { label: `${hrs}h`, urgent: false };
  return { label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }), urgent: false };
}

export default function TasksPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");

  const params: Record<string, string> = {};
  if (statusFilter && statusFilter !== "_all") params.status = statusFilter;
  if (tipoFilter && tipoFilter !== "_all") params.tipo = tipoFilter;

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", params],
    queryFn: () => tasksApi.list(params),
  });

  const { data: statsData } = useQuery({
    queryKey: ["tasks-stats"],
    queryFn: () => tasksApi.stats(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Task> }) => tasksApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks-stats"] });
      toast.success("Tarefa atualizada");
    },
    onError: () => toast.error("Erro ao atualizar tarefa"),
  });

  const tasks = data?.data ?? [];

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Operação"
        title="Tarefas"
        description="Follow-ups gerados automaticamente após cada ligação"
      />

      {/* Stats */}
      {statsData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Pendentes",     value: statsData.pendente,     color: "text-amber-600" },
            { label: "Em andamento",  value: statsData.em_andamento, color: "text-blue-600" },
            { label: "Concluídas",    value: statsData.concluido,    color: "text-emerald-600" },
            { label: "Total",         value: statsData.total,        color: "text-foreground" },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{label}</p>
                <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter || "_all"} onValueChange={v => setStatusFilter(v === "_all" ? "" : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tipoFilter || "_all"} onValueChange={v => setTipoFilter(v === "_all" ? "" : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos os tipos</SelectItem>
            {Object.entries(TIPO_CONFIG).map(([k, { label }]) => (
              <SelectItem key={k} value={k}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Nenhuma tarefa encontrada com esses filtros.</p>
          <p className="text-xs text-muted-foreground/60">Tarefas são criadas automaticamente após cada ligação.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const tipoCfg = TIPO_CONFIG[task.tipo];
            const TipoIcon = tipoCfg?.icon ?? ClipboardList;
            const statusCfg = STATUS_CONFIG[task.status];
            const prazo = formatPrazo(task.prazo);
            const isDone = task.status === "concluido" || task.status === "cancelado";

            return (
              <Card key={task.id} className={cn("transition-all", isDone && "opacity-60")}>
                <CardContent className="p-4 flex items-start gap-4">
                  {/* Ícone do tipo */}
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5", tipoCfg?.color)}>
                    <TipoIcon className="h-4 w-4" />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn("text-sm font-semibold text-foreground", isDone && "line-through")}>{task.titulo}</p>
                      <Badge variant="secondary" className={statusCfg.className}>{statusCfg.label}</Badge>
                      {prazo && (
                        <span className={cn("text-xs font-medium flex items-center gap-1", prazo.urgent ? "text-red-500" : "text-muted-foreground")}>
                          <Clock className="h-3 w-3" />
                          {prazo.label}
                        </span>
                      )}
                    </div>
                    {task.lead && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" />
                        {task.lead.nome}
                        {task.lead.empresa && ` · ${task.lead.empresa}`}
                        {task.lead.telefone && ` · ${task.lead.telefone}`}
                      </p>
                    )}
                    {task.descricao && (
                      <p className="text-xs text-muted-foreground">{task.descricao}</p>
                    )}
                  </div>

                  {/* Ações */}
                  {!isDone && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                        onClick={() => updateMutation.mutate({ id: task.id, body: { status: "concluido" } })}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Concluir
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-muted-foreground hover:text-foreground"
                        onClick={() => updateMutation.mutate({ id: task.id, body: { status: "cancelado" } })}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Paginação simples */}
      {(data?.count ?? 0) > 50 && (
        <p className="text-center text-xs text-muted-foreground">
          Exibindo 50 de {data?.count} tarefas
        </p>
      )}
    </div>
  );
}
