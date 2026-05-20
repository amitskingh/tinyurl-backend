import { Request, Response, NextFunction } from "express";
import { config } from "../config";
import { redisClient } from "../services/redis";

const createRateLimiter = (
  namespace: string,
  windowSeconds: number,
  maxRequests: number,
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const ip = req.ip;

      console.log(
        `Request coming from IP: ${ip} to ${req.originalUrl} from path ${req.path}`,
      );

      if (!ip) {
        res.status(400).json({
          success: false,
          message: "Unable to identify client IP",
        });

        return;
      }

      const path = req.originalUrl.split("?")[0];
      const key = `ratelimit:${namespace}:${path}:${ip}`;

      const requests = await redisClient.incr(key);

      if (requests === 1) {
        await redisClient.expire(key, windowSeconds);
      }

      if (requests > maxRequests) {
        res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
        });

        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const apiRateLimiter = createRateLimiter(
  "api",
  config.RATE_LIMIT_WINDOW_SEC,
  config.RATE_LIMIT_MAX,
);

export const shortCreationRateLimiter = createRateLimiter(
  "short-create",
  config.RATE_LIMIT_WINDOW_SEC,
  config.RATE_LIMIT_SHORT_MAX,
);
