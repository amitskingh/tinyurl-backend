import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import APIError from "../errors/APIError";
import { config } from "../config";
import { AuthTokenPayload } from "../../types/type";

export function signAuthToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, config.JWT_SECRET as Secret, options);
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET as Secret);
    if (
      typeof decoded !== "object" ||
      typeof decoded.userId !== "number" ||
      typeof decoded.email !== "string"
    ) {
      throw new APIError(401, "Invalid token", "INVALID_TOKEN");
    }
    return decoded as AuthTokenPayload;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(401, "Invalid or expired token", "INVALID_TOKEN");
  }
}
