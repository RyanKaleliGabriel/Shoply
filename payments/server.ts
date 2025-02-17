import app from "./app";
import Consul from "consul"
import { logger } from "./middlewares/logger";

const consul = new Consul({
  host: "consul",
  port: 8500,
});

const Environment = process.env.NODE_ENV;
const Port = process.env.PORT_PAYMENT;
const Service = process.env.SERVICE_PAYMENT;

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
    logger.info("Service registered with Consul");
  } catch (error) {
    console.error("Failed to register service:", error);
    logger.error("Failed to register service with consul", error);
  }
};

const deregisterService = async () => {
  try {
    await consul.agent.service.deregister(serviceId);
    console.log("Service registered with Consul");
    logger.info("Service deregistered with Consul");
  } catch (error) {
    console.error("Failed to register service:", error);
    logger.error("Failed to deregister service with consul", error);
  }
};

const server = app.listen(Port, async () => {
  console.log(`${Service} server running on ${Environment} envrionment.`);
  console.log(`${Service} server listening on port ${Port}.`);
  logger.info(
    `${Service} server running on ${Environment} envrionment and port ${Port}.`
  );
  await registerService();
});

// Handle graceful shutdown
// Signal interruption
process.on("SIGINT", async () => {
  await deregisterService();
  server.close(() => process.exit(0));
  logger.info(`${Service} gracefully shutting dow due to signal interruption.`);
});

process.on("SIGTERM", async () => {
  await deregisterService();
  server.close(() => process.exit(0));
  logger.info(`${Service} gracefully shutting dow due to signal termination.`);
});
