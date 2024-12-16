import app from "./app";

const Environment = process.env.NODE_ENV;
const Port = process.env.PORT_CART;
const Service = process.env.SERVICE_CART;

app.listen(Port, () => {
  console.log(`${Service} server running on ${Environment} environment.`);
  console.log(`${Service} sever listening on port ${Port}.`);
});
