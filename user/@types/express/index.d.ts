import User from "../../../models/app";
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
