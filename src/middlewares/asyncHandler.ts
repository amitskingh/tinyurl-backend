import { Request, Response, NextFunction } from "express";

export type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/** Runs async route handlers and forwards rejections to Express error middleware. */
export function asyncHandler(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}
