import app from "./app";
import Consul from "consul"

const consul = new Consul({
  host: "consul",
  port: 8500,
});


const Environment = process.env.NODE_ENV;
const Port = process.env.PORT_NOTIFICATION;
const Service = process.env.SERVICE_NOTIFICATION;

// Consul
const serviceId = `${Service}-${Math.floor(Math.random() * 1000)}`;

const registerService = async () => {
  try {
    await consul.agent.service.register({
      id: serviceId,
      name:   Service as string,
      address: Service as string,
      port: Number(Port),
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

const server = app.listen(Port, async () => {
  console.log(`${Service} server running on ${Environment} envrionment.`);
  console.log(`${Service} server listening on port ${Port}.`);
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
