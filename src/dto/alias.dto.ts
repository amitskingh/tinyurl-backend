import { z } from "zod";

const customAliasSchema = z
  .string()
  .min(3, "Custom alias must be at least 3 characters")
  .max(32, "Custom alias must be at most 32 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Custom alias may only contain letters, numbers, underscore, and hyphen"
  );

/** Reserved segments that overlap with API routes or common crawlers */
const RESERVED = new Set(["short", "analytics", "health", "api", "favicon.ico"]);

export const createAliasBodySchema = z
  .object({
    longURL: z.string().min(1, "URL cannot be empty"),
    customAlias: customAliasSchema.optional(),
    /** Number of days until the short link stops redirecting (optional) */
    expiresInDays: z.number().int().min(1).max(365).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.customAlias && RESERVED.has(data.customAlias.toLowerCase())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "This alias is reserved",
        path: ["customAlias"],
      });
    }
  });

export type CreateAliasBody = z.infer<typeof createAliasBodySchema>;
