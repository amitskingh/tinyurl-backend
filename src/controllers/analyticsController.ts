import { Response } from "express";
import APIError from "../errors/APIError";
import { asyncHandler } from "../middleware/asyncHandler";
import { getAnalyticsForUserAlias } from "../services/analyticsService";

export const getAnalytics = asyncHandler(async (req, res: Response) => {
  const aliasId = Number(req.params.aliasId);

  if (!aliasId || Number.isNaN(aliasId)) {
    throw new APIError(404, "Invalid alias", "INVALID_ALIAS");
  }

  const { userId } = req.user;
  if (!userId) {
    throw new APIError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const payload = await getAnalyticsForUserAlias(aliasId, userId);

  res.json(payload);
});
