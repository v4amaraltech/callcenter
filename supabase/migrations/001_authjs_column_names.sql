-- Corrige nomes de colunas para o @auth/pg-adapter (camelCase com aspas)
-- Erro sem isso: column a.userId does not exist

ALTER TABLE users RENAME COLUMN email_verified TO "emailVerified";

ALTER TABLE accounts RENAME COLUMN user_id TO "userId";
ALTER TABLE accounts RENAME COLUMN provider_account_id TO "providerAccountId";

ALTER TABLE sessions RENAME COLUMN user_id TO "userId";
ALTER TABLE sessions RENAME COLUMN session_token TO "sessionToken";
