#!/bin/bash
set -e

echo "→ Puxando atualizações..."
git pull origin main

echo "→ Build da imagem Docker..."
docker build -t callcenter-backend:latest .

echo "→ Deploy no Swarm..."
docker stack deploy -c docker-compose.yml callcenter --with-registry-auth

echo "✓ Deploy concluído"
docker service ls | grep callcenter
