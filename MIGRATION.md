# Guia de Migração: Supabase → VPS

## Visão Geral

| Antes | Depois |
|-------|--------|
| Supabase Postgres | PostgreSQL 16 (Docker na VPS) |
| Supabase Auth (Google) | NextAuth.js v5 + Google OAuth |
| Supabase Edge Function | Rota Express `/api/generate-agent-script` |
| Frontend na Vercel | Next.js dockerizado na VPS |

---

## Passo 1 — Exportar dados do Supabase

No **Dashboard do Supabase** → Settings → Database → Connection info, copie as credenciais e rode:

```bash
pg_dump \
  --no-owner --no-acl \
  --data-only \
  --exclude-table=auth.* \
  --exclude-table=storage.* \
  --exclude-table=realtime.* \
  "postgresql://postgres.mwautmbuzjpjfsplkkke:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \
  -f supabase_data.sql
```

> Só precisamos dos **dados** — o schema novo está em `supabase/migrations/000_base_schema.sql`.

---

## Passo 2 — Configurar Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Crie ou edite o OAuth 2.0 Client ID existente
3. Em **Authorized redirect URIs**, adicione:
   ```
   https://call.v4companyamaral.com/api/auth/callback/google
   ```
4. Salve e anote o `Client ID` e `Client Secret`

---

## Passo 3 — Criar o arquivo `.env` na VPS

```bash
ssh root@<IP_VPS>
mkdir -p /opt/callcenter
cat > /opt/callcenter/.env << 'EOF'
# Servidor
PORT=3001
PUBLIC_BASE_URL=https://api-call.v4companyamaral.com
WS_PUBLIC_URL=wss://api-call.v4companyamaral.com/media
NODE_ENV=production

# Banco de dados
DB_NAME=callcenter
DB_USER=postgres
DB_PASSWORD=SENHA_FORTE_AQUI

# Twilio
TWILIO_ACCOUNT_SID=REDACTED_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=REDACTED_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+5511REDACTED_PHONE

# Gemini
GEMINI_API_KEY=REDACTED_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.0-flash-live-001
GEMINI_VOICE=Kore

# Empresa
EMPRESA_NOME=V4 Company
N8N_WEBHOOK_URL=https://webhook-n8n.v4companyamaral.com/webhook/REDACTED_N8N_WEBHOOK_ID

# NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://call.v4companyamaral.com
GOOGLE_CLIENT_ID=SEU_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-SEU_SECRET
DATABASE_URL=postgresql://postgres:SENHA_FORTE_AQUI@postgres:5432/callcenter
EOF
```

---

## Passo 4 — Aplicar o schema no PostgreSQL

Primeiro, suba só o PostgreSQL temporariamente:

```bash
cd /opt/callcenter

# Subir só o postgres
docker stack deploy -c docker-compose.yml callcenter

# Aguardar o postgres iniciar (~10 segundos)
sleep 10

# Descobrir o container do postgres
docker ps | grep postgres

# Aplicar o schema base
docker exec -i $(docker ps -qf "name=callcenter_postgres") \
  psql -U postgres -d callcenter < supabase/migrations/000_base_schema.sql

# Se tiver dados para importar do Supabase:
docker exec -i $(docker ps -qf "name=callcenter_postgres") \
  psql -U postgres -d callcenter < supabase_data.sql
```

---

## Passo 5 — Criar primeiro admin

Após o primeiro login via Google, aprove e torne admin via SQL:

```bash
docker exec -it $(docker ps -qf "name=callcenter_postgres") psql -U postgres -d callcenter

-- Ver usuários cadastrados
SELECT id, email, created_at FROM users;

-- Aprovar e tornar admin (substitua o email)
UPDATE user_approvals
SET approved = true, admin = true, approved_at = now()
WHERE email = 'seu-email@v4company.com';
```

---

## Passo 6 — Deploy completo

```bash
# Fazer push para main disparará o GitHub Actions automaticamente
# Ou manualmente:
docker stack deploy -c docker-compose.yml callcenter

# Verificar status
docker stack services callcenter
docker service logs callcenter_backend  --follow
docker service logs callcenter_frontend --follow
```

---

## Passo 7 — Atualizar DNS

No seu provedor DNS, aponte:
- `call.v4companyamaral.com`     → IP da VPS Contabo
- `api-call.v4companyamaral.com` → IP da VPS Contabo (já deve estar assim)

---

## Passo 8 — Remover projeto do Supabase

Após testar tudo funcionando:
1. Supabase Dashboard → Settings → General → Delete project

---

## Variáveis de ambiente novos (resumo)

| Variável | Onde usar | Descrição |
|----------|-----------|-----------|
| `DB_HOST` | backend | `postgres` (nome do service Docker) |
| `DB_PORT` | backend | `5432` |
| `DB_NAME` | backend + frontend | `callcenter` |
| `DB_USER` | backend + frontend | `postgres` |
| `DB_PASSWORD` | backend + frontend | senha forte |
| `DATABASE_URL` | frontend (NextAuth) | `postgresql://...` |
| `NEXTAUTH_SECRET` | frontend | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | frontend | `https://call.v4companyamaral.com` |
| `GOOGLE_CLIENT_ID` | frontend | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | frontend | Google Cloud Console |

## Variáveis removidas

| Variável | Motivo |
|----------|--------|
| `SUPABASE_URL` | Substituído por PostgreSQL direto |
| `SUPABASE_ANON_KEY` | Não existe mais |
| `SUPABASE_SERVICE_ROLE_KEY` | Não existe mais |
| `NEXT_PUBLIC_SUPABASE_URL` | Substituído por NextAuth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Substituído por NextAuth |
| `DATABASE_PATH` | SQLite legado removido |
