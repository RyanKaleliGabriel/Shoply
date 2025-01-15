import { Pool } from "pg";

const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const host = process.env.POSTGRES_HOST;
const port = parseInt(process.env.POSTGRES_PORT || "5432");
const database = process.env.POSTGRES_DB;

const pool = new Pool({
  user,
  password,
  host,
  port,
  database,
});

export default pool;
