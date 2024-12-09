import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT;
const ENVIRONMENT = process.env.NODE_ENV;
const SERVICE = process.env.SERVICE;

app.listen(PORT, () => {
  console.log(`${SERVICE} server running on ${ENVIRONMENT} envrionment.`);
  console.log(`${SERVICE} server listening on port ${PORT}.`);
});
