import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export function aliasRepository(db: Prisma.TransactionClient | typeof prisma = prisma) {
  return {
    upsertLongUrl(originalUrl: string) {
      return db.longURL.upsert({
        where: { originalUrl },
        create: { originalUrl },
        update: {},
      });
    },

    findAliasByCustomAlias(customAlias: string) {
      return db.alias.findUnique({ where: { alias: customAlias } });
    },

    createAlias(data: {
      longURLId: number;
      userId?: number | null;
      alias: string;
      expiresAt?: Date | null;
    }) {
      return db.alias.create({
        data: {
          longURLId: data.longURLId,
          userId: data.userId ?? null,
          alias: data.alias,
          expiresAt: data.expiresAt ?? null,
        },
        include: { longURL: true },
      });
    },

    findByAliasWithLongUrl(shortCode: string) {
      return db.alias.findUnique({
        where: { alias: shortCode },
        include: { longURL: true },
      });
    },

    listForUser(userId: number) {
      return db.alias.findMany({
        where: { userId },
        include: { longURL: true },
      });
    },

    incrementClick(aliasId: number) {
      return db.alias.update({
        where: { id: aliasId },
        data: { clickCount: { increment: 1 } },
      });
    },
  };
}
