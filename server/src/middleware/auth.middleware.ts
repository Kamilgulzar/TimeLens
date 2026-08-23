import { Request, Response, NextFunction } from "express";
import { verifyToken, AUTH_COOKIE } from "../services/token.service";

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  let token: string | undefined;

  if (req.cookies && typeof req.cookies[AUTH_COOKIE] === "string") {
    token = req.cookies[AUTH_COOKIE];
  } else if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  try {
    const { userId } = verifyToken(token);
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};
