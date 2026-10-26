import { cache } from "react";
import { prisma } from "./db";

export const getSettings = cache(async () => {
  return prisma.businessSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
});

export type BusinessSettings = Awaited<ReturnType<typeof getSettings>>;
