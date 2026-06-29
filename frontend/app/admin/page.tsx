"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type UserApproval, type ApiKey } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ShieldCheck, ShieldX, UserCog, Key, Plus, Trash2, Eye, EyeOff,
  Copy, CheckCircle2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");

  // ── Users ──
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["user-approvals"],
    queryFn: adminApi.listUsers,
  });

  const patch = useMutation({
    mutationFn: ({ userId, fields }: { userId: string; fields: Partial<Pick<UserApproval, "approved" | "admin">> }) =>
      adminApi.patchUser(userId, fields),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["user-approvals"] }); toast.success("Atualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── API Keys ──
  const { data: keysData, isLoading: loadingKeys } = useQuery({
    queryKey: ["api-keys"],
    queryFn: adminApi.listApiKeys,
  });

  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<{ nome: string; key: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const createKeyMutation = useMutation({
    mutationFn: (nome: string) => adminApi.createApiKey(nome),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setCreatedKey({ nome: data.nome, key: data.key });
      setNewKeyName("");
      toast.success("API key criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleKeyMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => adminApi.toggleApiKey(id, ativo),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["api-keys"] }); toast.success("Atualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteApiKey(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["api-keys"] }); toast.success("API key removida"); },
    onError: (e: Error) => toast.error(e.message),
  });

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copiado!");
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Administração</h1>
        <p className="text-muted-foreground text-sm mt-1">Usuários, permissões e chaves de API</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        {/* ── Tab: Usuários ── */}
        <TabsContent value="users" className="mt-4">
          <div className="overflow-x-auto overflow-hidden rounded-lg bg-card card-elevated">
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
                {loadingUsers ? (
                  <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Carregando…</td></tr>
                ) : usersData?.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum usuário</td></tr>
                ) : usersData?.map((u) => (
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
        </TabsContent>

        {/* ── Tab: API Keys ── */}
        <TabsContent value="api-keys" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                Nova API Key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Nome da key (ex: Make.com, N8N, Integração X)"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && newKeyName.trim() && createKeyMutation.mutate(newKeyName.trim())}
                  className="max-w-sm"
                />
                <Button
                  onClick={() => newKeyName.trim() && createKeyMutation.mutate(newKeyName.trim())}
                  disabled={!newKeyName.trim() || createKeyMutation.isPending}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Gerar Key
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                A chave completa só é exibida uma vez após a criação. Copie e guarde em local seguro.
              </p>
            </CardContent>
          </Card>

          <div className="overflow-x-auto overflow-hidden rounded-lg bg-card card-elevated">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {["Nome", "Prefixo", "Status", "Último uso", "Criado em", "Ações"].map((h) => (
                    <th key={h} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingKeys ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Carregando…</td></tr>
                ) : keysData?.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">
                    Nenhuma API key criada ainda.
                  </td></tr>
                ) : keysData?.map((k) => (
                  <tr key={k.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="p-4 font-medium text-foreground">{k.nome}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{k.key_prefix}</td>
                    <td className="p-4">
                      <Badge variant={k.ativo ? "success" : "secondary"}>
                        {k.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {k.ultima_uso ? new Date(k.ultima_uso).toLocaleString("pt-BR") : "Nunca usada"}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(k.criado_em).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost"
                          className={`h-7 text-xs ${k.ativo ? "text-red-400 hover:bg-red-500/10" : "text-emerald-400 hover:bg-emerald-500/10"}`}
                          onClick={() => toggleKeyMutation.mutate({ id: k.id, ativo: !k.ativo })}>
                          {k.ativo ? "Desativar" : "Ativar"}
                        </Button>
                        <Button size="sm" variant="ghost"
                          className="h-7 text-xs text-muted-foreground hover:text-red-500"
                          onClick={() => { if (confirm("Remover esta API key permanentemente?")) deleteKeyMutation.mutate(k.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: mostrar key criada */}
      <Dialog open={!!createdKey} onOpenChange={() => { setCreatedKey(null); setShowKey(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              API Key criada — guarde agora!
            </DialogTitle>
            <DialogDescription>
              Esta é a única vez que a chave completa será exibida. Copie e guarde em local seguro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Nome</p>
              <p className="text-sm font-semibold">{createdKey?.nome}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Chave</p>
              <div className="flex gap-2 items-center">
                <div className="flex-1 font-mono text-xs bg-muted rounded-md px-3 py-2 overflow-hidden">
                  {showKey ? createdKey?.key : "••••••••••••••••••••••••••••••••"}
                </div>
                <Button size="icon" variant="outline" className="h-8 w-8 shrink-0"
                  onClick={() => setShowKey(v => !v)}>
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button size="icon" variant="outline" className="h-8 w-8 shrink-0"
                  onClick={() => createdKey && copyKey(createdKey.key)}>
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
              Use no header: <code className="font-mono">Authorization: Bearer {"<chave>"}</code>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
