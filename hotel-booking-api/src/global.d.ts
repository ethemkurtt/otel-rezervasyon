import { JwtPayload } from "./types/jwt-payload";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
export {};