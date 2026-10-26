import { prisma } from "./db";
import { PUBLIC_STATUSES } from "./packages";

export function getPublicPackages() {
  return prisma.package.findMany({
    where: { status: { in: PUBLIC_STATUSES } },
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
  });
}

export function getPublicPackage(slug: string) {
  return prisma.package.findFirst({
    where: { slug, status: { in: PUBLIC_STATUSES } },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      documents: { orderBy: { createdAt: "asc" } },
      faqs: { where: { published: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}
