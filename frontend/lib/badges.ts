export function interesseBadge(interesse?: string) {
  return (
    {
      alto: "badge-success",
      medio: "badge-info",
      baixo: "badge-warning",
      sem_interesse: "border-transparent bg-destructive/10 text-destructive",
      incerto: "border-border text-muted-foreground",
    }[interesse ?? "incerto"] ?? "border-border text-muted-foreground"
  );
}

export function statusBadge(status?: string) {
  return (
    {
      novo: "badge-info",
      contactado: "badge-warning",
      convertido: "badge-success",
      nao_contatar: "border-transparent bg-destructive/10 text-destructive",
      arquivado: "border-border text-muted-foreground",
    }[status ?? "novo"] ?? "badge-info"
  );
}

export function humorBadge(humor?: string) {
  return (
    {
      positivo: "badge-success",
      neutro: "border-border text-muted-foreground",
      negativo: "badge-warning",
      irritado: "border-transparent bg-destructive/10 text-destructive",
      incerto: "border-border text-muted-foreground",
    }[humor ?? "incerto"] ?? "border-border text-muted-foreground"
  );
}

export function proximo(acao?: string) {
  return (
    {
      enviar_whatsapp: "WhatsApp",
      enviar_email: "E-mail",
      agendar_reuniao: "Reunião",
      nao_contatar: "Não contatar",
      revisar_manualmente: "Revisar",
    }[acao ?? ""] ??
    acao ??
    "—"
  );
}
