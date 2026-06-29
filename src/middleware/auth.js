import { createHash } from "crypto";
import { query, execute } from "../db/pg.js";

// Rotas que NÃO precisam de autenticação (webhooks Twilio/inbound)
const PUBLIC_PREFIXES = ["/twiml/", "/hooks/", "/public/"];
function isPublicRoute(path) {
  return PUBLIC_PREFIXES.some(p => path.startsWith(p));
}

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

export function apiAuthMiddleware(req, res, next) {
  if (isPublicRoute(req.path)) return next();

  // Bypass para frontend interno (proxy Next.js)
  if (INTERNAL_SECRET && req.headers["x-internal"] === INTERNAL_SECRET) {
    req.apiKey = { nome: "internal", permissoes: ["read", "write"] };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Autenticação necessária. Use Authorization: Bearer <api_key>" });
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) return res.status(401).json({ error: "API key inválida" });

  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  query(
    "SELECT id, nome, permissoes FROM api_keys WHERE key_hash = $1 AND ativo = true",
    [keyHash]
  ).then(rows => {
    const key = rows[0];
    if (!key) return res.status(401).json({ error: "API key inválida ou inativa" });

    execute("UPDATE api_keys SET ultima_uso = now() WHERE id = $1", [key.id]).catch(() => {});
    req.apiKey = key;
    next();
  }).catch(err => {
    console.error("[auth] Erro ao validar API key:", err.message);
    res.status(500).json({ error: "Erro interno de autenticação" });
  });
}
