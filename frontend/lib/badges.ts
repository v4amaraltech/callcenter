export function interesseBadge(interesse?: string) {
  return {
    alto: "border-green-300 text-green-700 bg-green-50",
    medio: "border-blue-300 text-blue-700 bg-blue-50",
    baixo: "border-yellow-300 text-yellow-700 bg-yellow-50",
    sem_interesse: "border-red-300 text-red-700 bg-red-50",
    incerto: "border-gray-300 text-gray-600",
  }[interesse ?? "incerto"] ?? "border-gray-300 text-gray-600";
}

export function statusBadge(status?: string) {
  return {
    novo: "border-blue-300 text-blue-700 bg-blue-50",
    contactado: "border-yellow-300 text-yellow-700 bg-yellow-50",
    convertido: "border-green-300 text-green-700 bg-green-50",
    nao_contatar: "border-red-300 text-red-700 bg-red-50",
    arquivado: "border-gray-300 text-gray-400 bg-gray-50",
  }[status ?? "novo"] ?? "border-gray-300 text-gray-600";
}

export function humorBadge(humor?: string) {
  return {
    positivo: "border-green-300 text-green-700 bg-green-50",
    neutro: "border-gray-300 text-gray-600",
    negativo: "border-orange-300 text-orange-700 bg-orange-50",
    irritado: "border-red-300 text-red-700 bg-red-50",
    incerto: "border-gray-300 text-gray-600",
  }[humor ?? "incerto"] ?? "border-gray-300 text-gray-600";
}

export function proximo(acao?: string) {
  return {
    enviar_whatsapp: "WhatsApp",
    enviar_email: "E-mail",
    agendar_reuniao: "Reunião",
    nao_contatar: "Não contatar",
    revisar_manualmente: "Revisar",
  }[acao ?? ""] ?? acao ?? "—";
}
