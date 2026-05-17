import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";
import { verifyAuthToken } from "../utils/jwt";

export const appendUserdId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [scheme, token] = req.headers.authorization?.split(" ") ?? [];
    if (scheme === "Bearer" && token) {
      const decodedToken = verifyAuthToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decodedToken.userId },
        select: { id: true },
      });

      if (user) {
        req.user.userId = user.id;
      }
    }
  } catch (error) {
    console.warn("appendUserId: token verification skipped:", error);
  } finally {
    next();
  }
};
