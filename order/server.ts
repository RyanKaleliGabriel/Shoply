import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const Environment = process.env.NODE_ENV;
const Port = process.env.PORT;
const Service = process.env.SERVICE;

app.listen(Port, () => {
  console.log(`${Service} server running on ${Environment} environement`);
  console.log(`${Service} server listening on port ${Port}`);
});
