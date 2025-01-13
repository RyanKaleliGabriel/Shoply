import app from "./app";
import { Client } from "pg";

const Environment = process.env.NODE_ENV;
const Port_Cart = process.env.PORT_CART;
const Service = process.env.SERVICE_CART;

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

app.listen(Port_Cart, () => {
  console.log(`${Service} server running on ${Environment} environment.`);
  console.log(`${Service} sever listening on Cart ${Port_Cart}.`);
});
