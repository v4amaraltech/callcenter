"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type UserApproval } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldX, UserCog } from "lucide-react";

export default function AdminPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["user-approvals"],
    queryFn: adminApi.listUsers,
  });

  const patch = useMutation({
    mutationFn: ({ userId, fields }: { userId: string; fields: Partial<Pick<UserApproval, "approved" | "admin">> }) =>
      adminApi.patchUser(userId, fields),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-approvals"] });
      toast.success("Atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Administração</h1>
        <p className="text-muted-foreground text-sm mt-1">Aprovação de acesso e permissões de usuários</p>
      </motion.div>

      <div className="overflow-hidden rounded-lg bg-card card-elevated">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {["Email", "Status", "Admin", "Cadastro", "Ações"].map((h) => (
                <th key={h} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-xs">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Carregando…</td></tr>
            ) : data?.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum usuário</td></tr>
            ) : data?.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/50">
                <td className="p-4 text-sm text-foreground">{u.email}</td>
                <td className="p-4">
                  <Badge variant={u.approved ? "success" : "warning"}>
                    {u.approved ? "Aprovado" : "Pendente"}
                  </Badge>
                </td>
                <td className="p-4">
                  <Badge variant={u.admin ? "info" : "secondary"}>
                    {u.admin ? "Admin" : "—"}
                  </Badge>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {!u.approved ? (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-green-400 hover:bg-green-500/10"
                        onClick={() => patch.mutate({ userId: u.user_id, fields: { approved: true } })}>
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Aprovar
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:bg-red-500/10"
                        onClick={() => patch.mutate({ userId: u.user_id, fields: { approved: false } })}>
                        <ShieldX className="w-3.5 h-3.5 mr-1" /> Revogar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost"
                      className={`h-7 text-xs hover:bg-muted/40 ${u.admin ? "text-primary" : "text-muted-foreground"}`}
                      onClick={() => patch.mutate({ userId: u.user_id, fields: { admin: !u.admin } })}>
                      <UserCog className="w-3.5 h-3.5 mr-1" /> {u.admin ? "Remover admin" : "Tornar admin"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
