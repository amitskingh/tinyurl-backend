import bcrypt from "bcrypt";
import { prisma } from "../prisma";
import APIError from "../errors/APIError";
import { asyncHandler } from "../middlewares/asyncHandler";
import { loginBodySchema, signupBodySchema } from "../dto/auth.dto";
import { signAuthToken } from "../utils/jwt";

const SALT_ROUNDS = 12;

function toAuthResponse(user: { id: number; email: string; name: string }) {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    token: signAuthToken({ userId: user.id, email: user.email }),
  };
}

export const signup = asyncHandler(async (req, res) => {
  const body = signupBodySchema.parse(req.body);
  const existing = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (existing) {
    throw new APIError(409, "Email is already registered", "EMAIL_EXISTS");
  }

  const password = await bcrypt.hash(body.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      password,
    },
  });

  res.status(201).json({
    status: "success",
    data: toAuthResponse(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const body = loginBodySchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (!user) {
    throw new APIError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const passwordOk = await bcrypt.compare(body.password, user.password);
  if (!passwordOk) {
    throw new APIError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  res.status(200).json({
    status: "success",
    data: toAuthResponse(user),
  });
});

export const logout = asyncHandler(async (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "Logged out",
  });
});

export const me = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new APIError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    throw new APIError(401, "Unauthorized", "USER_NOT_FOUND");
  }

  res.status(200).json({
    status: "success",
    data: { user },
  });
});
