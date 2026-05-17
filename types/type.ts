import { type JwtPayload } from "jsonwebtoken";

export type ClickJobData = {
  aliasId: number;
  ip: string;
  referrer: string;
  userAgent: string;
  totalClickCount: number;
};

export type AuthTokenPayload = JwtPayload & {
  userId: number;
  email: string;
};