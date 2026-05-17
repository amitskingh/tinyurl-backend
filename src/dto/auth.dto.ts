import { z } from "zod";

export const signupBodySchema = z.object({
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1, "Name is required").max(80),
});

export const loginBodySchema = z.object({
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type SignupBody = z.infer<typeof signupBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
