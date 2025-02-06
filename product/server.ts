import app from "./app";
import { Client } from "pg";
import Consul from "consul";

const consul = new Consul({
  host: "consul",
  port: 8500,
});

const PORT_PRODUCT = process.env.PORT_PRODUCT;
const Environment = process.env.NODE_ENV;
const Service = process.env.SERVICE_PRODUCT;

const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const host = process.env.POSTGRES_HOST;
const port = parseInt(process.env.POSTGRES_PORT || "5432");
const database = process.env.POSTGRES_DB;

// Consul
const serviceId = `${Service}-${Math.floor(Math.random() * 1000)}`;

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

const registerService = async () => {
  try {
    await consul.agent.service.register({
      id: serviceId,
      name:   Service as string,
      address: Service as string,
      port: Number(PORT_PRODUCT),
    });
    console.log("Service registered with Consul");
  } catch (error) {
    console.error("Failed to register service:", error);
  }
};

const deregisterService = async () => {
  try {
    await consul.agent.service.deregister(serviceId);
    console.log("Service deregistered with Consul");
  } catch (error) {
    console.error("Failed to deregister service:", error);
  }
};

const server = app.listen(PORT_PRODUCT, async () => {
  console.log(`${Service} server running on ${Environment} envrionment.`);
  console.log(`${Service} server listening on port ${PORT_PRODUCT}.`);
  await connectDB();
  await registerService();
});

// Handle graceful shutdown
// Signal interruption
process.on("SIGINT", async () => {
  await deregisterService();
  server.close(() => process.exit(0));
});

process.on("SIGTERM", async () => {
  await deregisterService();
  server.close(() => process.exit(0));
});
