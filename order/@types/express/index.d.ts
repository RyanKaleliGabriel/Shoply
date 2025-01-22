import  User, { safaricomAccessToken } from "../../../models/app";
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: Token;
      safaricomAccessToken: safaricomAccessToken
    }
  }
}
