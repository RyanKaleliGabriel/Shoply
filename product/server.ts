import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const Port = process.env.PORT_PRODUCT;
const Environment = process.env.NODE_ENV;
const Service = process.env.SERVICE_PRODUCT;

app.listen(Port, () => {
  console.log(`${Service} server is running on ${Environment} development.`);
  console.log(`${Service} server is listening on port ${Port}.`);
});
