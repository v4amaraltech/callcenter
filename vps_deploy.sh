#!/bin/bash
# Deploy completo no VPS — sempre carrega .env antes do stack deploy
set -e
cd /root/callcenter

echo "[deploy] Carregando .env..."
set -a
source .env
set +a

echo "[deploy] Stack deploy..."
docker stack deploy \
  --compose-file docker-compose.yml \
  --with-registry-auth \
  callcenter

echo "[deploy] Aguardando servicos..."
sleep 15

echo "[deploy] Reaplicando env vars (Portainer/Swarm zera secrets do compose)..."
bash /root/callcenter/fix_deploy.sh

echo "[deploy] Backend env..."
docker service update \
  --env-add "DB_HOST=callcenter_postgres" \
  --env-add "DB_PASSWORD=${DB_PASSWORD}" \
  --env-add "DB_NAME=${DB_NAME:-callcenter}" \
  --env-add "DB_USER=${DB_USER:-postgres}" \
  callcenter_backend 2>/dev/null || true

echo "[deploy] Status:"
docker service ls | grep callcenter
