import { Client } from "pg";
import app from "./app";


const Environment = process.env.NODE_ENV;
const Port_Order = process.env.PORT_ORDER;
const Service = process.env.SERVICE_ORDER;

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

const connectDb = async () => {
  try {
    await client.connect();
    console.log("Connected to Db");
  } catch (err) {
    console.error("Error when connecting to database.", err);
  }
};

connectDb();


app.listen(Port_Order, () => {
  console.log(`${Service} server running on ${Environment} environement`);
  console.log(`${Service} server listening on port ${Port_Order}`);
});
