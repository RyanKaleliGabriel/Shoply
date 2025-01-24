import User, { safaricomAccessToken, Token } from "../../../models/app";
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: Token;
      safaricomAccessToken: safaricomAccessToken
    }
  }
}
