import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const Environment = process.env.NODE_ENV;
const Port = process.env.PORT_NOTIFICATION;
const Service = process.env.SERVICE_NOTIFICATION;

app.listen(Port, () => {
  console.log(`${Service} server running on ${Environment} environment`);
  console.log(`${Service} server listening on port ${Port}.`);
});
