import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host:     process.env.DB_HOST     ?? "postgres",
  port:     parseInt(process.env.DB_PORT ?? "5432"),
  database: process.env.DB_NAME     ?? "callcenter",
  user:     process.env.DB_USER     ?? "postgres",
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("[pg] client error", err.message);
});

/** Executa query e retorna todas as linhas. */
export async function query(sql, params) {
  const res = await pool.query(sql, params);
  return res.rows;
}

/** Executa query e retorna a primeira linha ou null. */
export async function queryOne(sql, params) {
  const res = await pool.query(sql, params);
  return res.rows[0] ?? null;
}

/** Executa query e retorna rowCount. */
export async function execute(sql, params) {
  const res = await pool.query(sql, params);
  return res.rowCount ?? 0;
}
