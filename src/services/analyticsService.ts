import { prisma } from "../prisma";
import APIError from "../errors/APIError";

export async function getAnalyticsForUserAlias(aliasId: number, userId: number) {
  const aliasRecord = await prisma.alias.findFirst({
    where: { id: aliasId, userId },
  });

  if (!aliasRecord) {
    throw new APIError(
      404,
      "Alias not found for this user",
      "ALIAS_NOT_FOUND"
    );
  }

  const totalClicks = aliasRecord.clickCount;

  const uniqueClicksData = await prisma.clickAnalytics.groupBy({
    by: ["ipAddress"],
    where: { aliasId, ipAddress: { not: "unknown" } },
    _count: {
      ipAddress: true,
    },
  });

  const uniqueClicks = uniqueClicksData.length;

  const countryStats = await prisma.clickAnalytics.groupBy({
    by: ["country"],
    where: { aliasId, country: { not: null } },
    _count: { _all: true },
  });

  const countries = countryStats.reduce((acc, curr) => {
    if (curr.country) acc[curr.country] = curr._count._all;
    return acc;
  }, {} as Record<string, number>);

  const referrerStats = await prisma.clickAnalytics.groupBy({
    by: ["referrer"],
    where: { aliasId, referrer: { not: null } },
    _count: { referrer: true },
    orderBy: {
      _count: {
        referrer: "desc",
      },
    },
    take: 3,
  });

  const referrers = referrerStats.reduce((acc, curr) => {
    const key = curr.referrer || "Direct";
    acc[key] = curr._count.referrer;
    return acc;
  }, {} as Record<string, number>);

  const deviceStats = await prisma.clickAnalytics.groupBy({
    by: ["device"],
    where: { aliasId, device: { not: null } },
    _count: { device: true },
  });

  const devices = deviceStats.reduce((acc, curr) => {
    if (curr.device) acc[curr.device] = curr._count.device;
    return acc;
  }, {} as Record<string, number>);

  const browserStats = await prisma.clickAnalytics.groupBy({
    by: ["browser"],
    where: { aliasId, browser: { not: null } },
    _count: { browser: true },
  });

  const browsers = browserStats.reduce((acc, curr) => {
    if (curr.browser) acc[curr.browser] = curr._count.browser;
    return acc;
  }, {} as Record<string, number>);

  const osStats = await prisma.clickAnalytics.groupBy({
    by: ["os"],
    where: { aliasId, os: { not: null } },
    _count: { os: true },
  });

  const oses = osStats.reduce((acc, curr) => {
    if (curr.os) acc[curr.os] = curr._count.os;
    return acc;
  }, {} as Record<string, number>);

  return {
    aliasId,
    totalClicks,
    uniqueClicks,
    countries,
    referrers,
    devices,
    browsers,
    os: oses,
  };
}
