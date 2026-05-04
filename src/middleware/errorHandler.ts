import { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import APIError from "../errors/APIError";
import { config } from "../config";

function isDev() {
  return config.NODE_ENV !== "production";
}

const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (res.headersSent) {
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      status: "error",
      message: "Validation failed",
      errorCode: "VALIDATION_ERROR",
      details: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof APIError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      errorCode: err.errorCode,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        status: "error",
        message: "A record with this unique value already exists",
        errorCode: "UNIQUE_VIOLATION",
      });
      return;
    }
  }

  const message =
    err instanceof Error ? err.message : "Internal Server Error";
  console.error("Unhandled error:", err);

  res.status(500).json({
    status: "error",
    message: isDev() ? message : "Internal Server Error",
    errorCode: "INTERNAL_SERVER_ERROR",
  });
};

export { errorHandler };
