import app from "./app";
import { Client } from "pg";

const Port = process.env.PORT_PRODUCT;
const Environment = process.env.NODE_ENV;
const Service = process.env.SERVICE_PRODUCT;

const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const host = process.env.POSTGRES_HOST;
const port = parseInt(process.env.POSTGRES_PORT || "5432");
const database = process.env.POSTGRES_DB;

const client = new Client({
  user,
  password,
  host,
  port,
  database,
});

const connectDb = async () => {
  try {
    await client.connect();
    console.log("Connect to Db");
  } catch (err) {
    console.error("Error when connecting to database", err);
  }
};

connectDb();

app.listen(Port, () => {
  console.log(`${Service} server is running on ${Environment} development.`);
  console.log(`${Service} server is listening on port ${Port}.`);
});
