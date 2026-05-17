import { Prisma } from "@prisma/client";
import APIError from "../errors/APIError";
import { config } from "../config";
import { prisma } from "../prisma";
import { aliasRepository } from "../repositories/aliasRepository";
import { generateShortCode } from "./shortCodeGenerator";
import { normalizeAndValidateDestinationUrl } from "../utils/urlValidation";
import { CreateAliasBody } from "../dto/alias.dto";
import { redisClient } from "./redis";
import { trackClick } from "../queues/queue";

function cacheTtlSeconds(expiresAt: Date | null | undefined): number {
  const cap = config.ALIAS_CACHE_TTL_SEC;
  if (!expiresAt) return cap;
  const sec = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  return Math.max(0, Math.min(cap, sec));
}

function isExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() <= Date.now();
}

export async function createAliasService(
  body: CreateAliasBody,
  userId?: number
) {
  const originalUrl = normalizeAndValidateDestinationUrl(body.longURL);
  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + body.expiresInDays * 86_400_000)
    : null;

  if (body.customAlias) {
    const shortCode = body.customAlias;
    const existing = await aliasRepository().findAliasByCustomAlias(shortCode);
    if (existing) {
      throw new APIError(400, "Alias already exists", "ALIAS_EXISTS");
    }

    return prisma.$transaction(async (tx) => {
      const repo = aliasRepository(tx);
      const longURLRecord = await repo.upsertLongUrl(originalUrl);
      try {
        return await repo.createAlias({
          longURLId: longURLRecord.id,
          userId,
          alias: shortCode,
          expiresAt,
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          throw new APIError(400, "Alias already exists", "ALIAS_EXISTS");
        }
        throw e;
      }
    });
  }

  for (let attempt = 0; attempt < config.SHORT_CODE_MAX_ATTEMPTS; attempt++) {
    const shortCode = generateShortCode();

    try {
      return await prisma.$transaction(async (tx) => {
        const repo = aliasRepository(tx);
        const longURLRecord = await repo.upsertLongUrl(originalUrl);
        return await repo.createAlias({
          longURLId: longURLRecord.id,
          userId,
          alias: shortCode,
          expiresAt,
        });
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        continue;
      }
      throw e;
    }
  }

  throw new APIError(
    503,
    "Could not allocate a short code; try again",
    "SHORT_CODE_EXHAUSTED"
  );
}

export async function listAliasesForUser(userId: number | undefined) {
  if (!userId) {
    throw new APIError(401, "Unauthorized", "UNAUTHORIZED");
  }
  return aliasRepository().listForUser(userId);
}

export async function deleteAliasForUser(aliasId: number, userId: number | undefined) {
  if (!userId) {
    throw new APIError(401, "Unauthorized", "UNAUTHORIZED");
  }

  if (!aliasId || Number.isNaN(aliasId)) {
    throw new APIError(404, "Invalid alias", "INVALID_ALIAS");
  }

  const repo = aliasRepository();
  const alias = await repo.findOwnedAlias(aliasId, userId);
  if (!alias) {
    throw new APIError(404, "Alias not found", "ALIAS_NOT_FOUND");
  }

  await repo.deleteAlias(aliasId);
  if (alias.alias) {
    await redisClient.del(`alias:${alias.alias}`);
  }
}

export type RedirectContext = {
  ip: string;
  referrer: string;
  userAgent: string;
};

export async function resolveRedirectService(
  shortCode: string,
  ctx: RedirectContext
) {
  const cacheKey = `alias:${shortCode}`;
  const cachedURL = await redisClient.get(cacheKey);

  if (cachedURL) {
    const row = await aliasRepository().findByAliasWithLongUrl(shortCode);
    if (!row || isExpired(row.expiresAt)) {
      await redisClient.del(cacheKey);
      throw new APIError(404, "Alias not found", "ALIAS_NOT_FOUND");
    }

    const updated = await aliasRepository().incrementClick(row.id);
    trackClick({
      aliasId: row.id,
      ip: ctx.ip,
      referrer: ctx.referrer,
      userAgent: ctx.userAgent,
      totalClickCount: updated.clickCount,
    });

    return { status: "redirect" as const, url: cachedURL };
  }

  const aliasRecord = await aliasRepository().findByAliasWithLongUrl(shortCode);

  if (!aliasRecord || isExpired(aliasRecord.expiresAt)) {
    if (aliasRecord?.expiresAt) {
      await redisClient.del(cacheKey);
    }
    throw new APIError(404, "Alias not found", "ALIAS_NOT_FOUND");
  }

  const updated = await aliasRepository().incrementClick(aliasRecord.id);

  trackClick({
    aliasId: aliasRecord.id,
    ip: ctx.ip,
    referrer: ctx.referrer,
    userAgent: ctx.userAgent,
    totalClickCount: updated.clickCount,
  });

  const ttl = cacheTtlSeconds(aliasRecord.expiresAt);
  if (ttl > 0) {
    await redisClient.setex(
      cacheKey,
      ttl,
      aliasRecord.longURL.originalUrl
    );
  }

  return {
    status: "redirect" as const,
    url: aliasRecord.longURL.originalUrl,
  };
}
