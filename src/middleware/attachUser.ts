import { Request, Response, NextFunction } from "express";

/** Ensures `req.user` exists for downstream handlers and typings. */
export function attachUser(req: Request, _res: Response, next: NextFunction) {
  req.user ??= { userId: undefined };
  next();
}
