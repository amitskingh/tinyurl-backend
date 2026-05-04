import { asyncHandler } from "../middleware/asyncHandler";
import { createAliasBodySchema } from "../dto/alias.dto";
import {
  createAliasService,
  listAliasesForUser,
  resolveRedirectService,
} from "../services/aliasService";

export const fetchAllAlias = asyncHandler(async (req, res) => {
  const records = await listAliasesForUser(req.user.userId);
  res.status(200).json({
    status: "success",
    data: {
      aliases: records.map((aliasRecord) => ({
        aliasId: aliasRecord.id,
        alias: aliasRecord.alias,
        clickCount: aliasRecord.clickCount,
        URLId: aliasRecord.longURLId,
        longURL: aliasRecord.longURL.originalUrl,
        expiresAt: aliasRecord.expiresAt,
      })),
    },
  });
});

export const createAlias = asyncHandler(async (req, res) => {
  const body = createAliasBodySchema.parse(req.body);
  const userId = req.user?.userId;
  const updatedAlias = await createAliasService(body, userId);

  res.status(201).json({
    status: "success",
    message: "Alias created successfully",
    data: {
      alias: updatedAlias,
      longURL: updatedAlias.longURL,
    },
  });
});

export const redirectAlias = asyncHandler(async (req, res) => {
  const { shortURL } = req.params;
  const result = await resolveRedirectService(shortURL, {
    ip: req.ip || "unknown",
    referrer: req.get("Referrer") || "Direct",
    userAgent: req.get("User-Agent") || "unknown",
  });

  res.redirect(301, result.url);
});
