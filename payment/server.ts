import app from "./app";


const Environment = process.env.NODE_ENV;
const Port = process.env.PORT_PAYMENT;
const Service = process.env.SERVICE_PAYMENT;

app.listen(Port, () => {
  console.log(`${Service} server running on ${Environment} environment.`);
  console.log(`${Service} server is listening on port ${Port}.`);
});
