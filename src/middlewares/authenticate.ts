import { NextFunction, Request, Response } from "express";
import APIError from "../errors/APIError";
import { prisma } from "../prisma";
import { verifyAuthToken } from "../utils/jwt";

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [scheme, token] = req.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) {
      throw new APIError(401, "Unauthorized", "INVALID_TOKEN");
    }

    const decodedToken = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      select: { id: true },
    });

    if (!user) {
      throw new APIError(401, "Unauthorized", "USER_NOT_FOUND");
    }

    req.user = { userId: user.id };
    next();
  } catch (error) {
    if (error instanceof APIError) {
      res.status(error.statusCode).json({
        status: "error",
        message: error.message,
        errorCode: error.errorCode,
      });

      return;
    }

    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      errorCode: "INTERNAL_SERVER_ERROR",
    });
  }
};

export default authenticate;
