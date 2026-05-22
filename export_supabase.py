import urllib.request, json, sys

SUPABASE_URL = "https://mwautmbuzjpjfsplkkke.supabase.co"
SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YXV0bWJ1empwamZzcGxra2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzkwMDcwMywiZXhwIjoyMDkzNDc2NzAzfQ.B-mCGOMjyJsLZlHD4YWPIRmCAr0fHrNPKfhd17QLP6M"

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": "Bearer " + SERVICE_KEY,
}

def fetch(table):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit=50000",
        headers=HEADERS
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def pg_val(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (dict, list)):
        escaped = json.dumps(v, ensure_ascii=False).replace("'", "''")
        return f"'{escaped}'"
    escaped = str(v).replace("'", "''")
    return f"'{escaped}'"

TABLES = [
    "bot_config",
    "agents",
    "campaigns",
    "leads",
    "call_results",
    "transcripts",
    "lead_info_chave",
    "user_approvals",
]

lines = [
    "-- Supabase data export — migração para PostgreSQL self-hosted",
    "SET client_encoding = 'UTF8';",
    "",
]

for table in TABLES:
    rows = fetch(table)
    lines.append(f"-- Tabela: {table} ({len(rows)} linhas)")
    for row in rows:
        cols = list(row.keys())
        vals = [pg_val(row[c]) for c in cols]
        cols_str = ", ".join(cols)
        vals_str = ", ".join(vals)
        lines.append(
            f"INSERT INTO {table} ({cols_str}) VALUES ({vals_str}) ON CONFLICT DO NOTHING;"
        )
    lines.append("")
    print(f"  {table}: {len(rows)} linhas")

out = "\n".join(lines)
with open("supabase_data.sql", "w", encoding="utf-8") as f:
    f.write(out)

print(f"\nExportado para supabase_data.sql ({len(lines)} linhas)")
