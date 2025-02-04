import Consul from "consul";
import { Client } from "pg";
import app from "./app";

const consul = new Consul({
  host: "consul",
  port: 8500,
});

// Service
const PORT_USER = process.env.PORT_USER;
const ENVIRONMENT = process.env.NODE_ENV;
const SERVICE = process.env.SERVICE_USER;

// DB
const user = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const host = process.env.POSTGRES_HOST;
const port = parseInt(process.env.POSTGRES_PORT || "5432");
const database = process.env.POSTGRES_DB;

// Consul
const serviceId = `${SERVICE}-${Math.floor(Math.random() * 1000)}`;

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
      name:   SERVICE as string,
      address: SERVICE as string,
      port: Number(PORT_USER),
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

const server = app.listen(PORT_USER, async () => {
  console.log(`${SERVICE} server running on ${ENVIRONMENT} envrionment.`);
  console.log(`${SERVICE} server listening on port ${PORT_USER}.`);
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
