#!/bin/bash
set -e

echo "=== 1. Corrigindo .env ==="
sed -i 's/^EMPRESA_NOME=V4 Company$/EMPRESA_NOME="V4 Company"/' /root/callcenter/.env
echo "OK"

echo "=== 2. Aguardando postgres subir ==="
for i in $(seq 1 24); do
  PGID=$(docker ps -qf name=callcenter_postgres 2>/dev/null | head -1)
  if [ -n "$PGID" ]; then
    STATUS=$(docker inspect --format='{{.State.Status}}' "$PGID" 2>/dev/null)
    if [ "$STATUS" = "running" ]; then
      echo "Postgres RODANDO! Container: $PGID"
      break
    fi
  fi
  echo "  Tentativa $i/24 â€” aguardando 5s..."
  sleep 5
done

PGID=$(docker ps -qf name=callcenter_postgres 2>/dev/null | head -1)
if [ -z "$PGID" ]; then
  echo "ERRO: Postgres nÃ£o iniciou. Verificando..."
  docker service ps callcenter_postgres --no-trunc
  exit 1
fi

echo "=== 3. Aguardando Postgres aceitar conexÃµes ==="
for i in $(seq 1 12); do
  if docker exec "$PGID" pg_isready -U postgres -q 2>/dev/null; then
    echo "Postgres aceitando conexÃµes!"
    break
  fi
  echo "  Aguardando pg_isready... $i/12"
  sleep 5
done

echo "=== 4. Criando banco callcenter ==="
docker exec "$PGID" psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='callcenter'" | grep -q 1 || \
  docker exec "$PGID" psql -U postgres -c "CREATE DATABASE callcenter;"
echo "Banco criado (ou jÃ¡ existia)"

echo "=== 5. Aplicando schema base ==="
docker exec -i "$PGID" psql -U postgres -d callcenter < /root/callcenter/000_base_schema.sql
echo "Schema aplicado!"

echo "=== 6. Importando dados do Supabase ==="
docker exec -i "$PGID" psql -U postgres -d callcenter < /root/callcenter/supabase_data.sql
echo "Dados importados!"

echo "=== 7. Verificando tabelas ==="
docker exec "$PGID" psql -U postgres -d callcenter -c "\dt"

echo ""
echo "=== CONCLUÃDO ==="
docker stack services callcenter
