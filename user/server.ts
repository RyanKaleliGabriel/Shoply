import { Client } from "pg";
import app from "./app";

const PORT_USER = process.env.PORT_USER;
const ENVIRONMENT = process.env.NODE_ENV;
const SERVICE = process.env.SERVICE_USER;

const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const host = process.env.POSTGRES_HOST;
const port = parseInt(process.env.POSTGRES_PORT || "5432");
const database = process.env.POSTGRES_DB;

const client = new Client({
  host,
  port,
  user,
  password,
  database,
});

const connectDB = async () => {
  try {
    await client.connect(); // Simple query to test connection
    console.log("Connected to Db");
  } catch (err) {
    console.error("Error when connecting to database.", err);
  }
};

connectDB();

app.listen(PORT_USER, () => {
  console.log(`${SERVICE} server running on ${ENVIRONMENT} envrionment.`);
  console.log(`${SERVICE} server listening on port ${PORT_USER}.`);
});
