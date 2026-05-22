#!/bin/bash
set -e

ENV_FILE="/root/callcenter/.env"

# Carregar variáveis do .env
set -a
source "$ENV_FILE"
set +a

echo "Verificando variaveis carregadas..."
echo "NEXTAUTH_SECRET=${NEXTAUTH_SECRET:0:10}..."
echo "DATABASE_URL=${DATABASE_URL:0:30}..."
echo "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:0:20}..."

# Atualizar serviço com todas as variáveis de uma vez
docker service update \
  --env-add "AUTH_SECRET=${NEXTAUTH_SECRET}" \
  --env-add "AUTH_TRUST_HOST=true" \
  --env-add "AUTH_URL=https://call.v4companyamaral.com" \
  --env-add "NEXTAUTH_SECRET=${NEXTAUTH_SECRET}" \
  --env-add "NEXTAUTH_URL=https://call.v4companyamaral.com" \
  --env-add "DATABASE_URL=${DATABASE_URL}" \
  --env-add "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}" \
  --env-add "GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}" \
  callcenter_frontend

echo "Atualizando backend..."
docker service update \
  --env-add "DB_HOST=callcenter_postgres" \
  --env-add "DB_PASSWORD=${DB_PASSWORD}" \
  --env-add "DB_NAME=${DB_NAME:-callcenter}" \
  --env-add "DB_USER=${DB_USER:-postgres}" \
  callcenter_backend 2>/dev/null || true

echo "Servico atualizado. Verificando..."
docker service inspect callcenter_frontend --format '{{range .Spec.TaskTemplate.ContainerSpec.Env}}{{println .}}{{end}}' | grep -E "AUTH_SECRET|DATABASE_URL|GOOGLE_CLIENT"
