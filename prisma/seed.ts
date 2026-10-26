/**
 * Seeds the initial catalogue exactly as supplied by the business owner.
 * Only name, tier and price are populated. Every operational detail is left
 * empty and unverified, so packages start in the ENQUIRY state and the public
 * site shows "Enquire for Full Details" until an administrator confirms them.
 */
import { PrismaClient, PackageTier, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const INITIAL_PACKAGES = [
  { slug: "hajj-regular", name: "Hajj Regular", tier: PackageTier.REGULAR, price: "8700000", sortOrder: 1 },
  { slug: "hajj-standard", name: "Hajj Standard", tier: PackageTier.STANDARD, price: "9500000", sortOrder: 2 },
  { slug: "hajj-vip", name: "Hajj VIP", tier: PackageTier.VIP, price: "22000000", sortOrder: 3 },
] as const;

async function main() {
  await prisma.businessSettings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });

  for (const p of INITIAL_PACKAGES) {
    const existing = await prisma.package.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`• ${p.name} already exists — left unchanged (price ${existing.price} ${existing.currency})`);
      continue;
    }
    const created = await prisma.package.create({
      data: {
        slug: p.slug,
        name: p.name,
        tier: p.tier,
        price: p.price,
        currency: "NGN",
        sortOrder: p.sortOrder,
        status: "ENQUIRY",
      },
    });
    await prisma.priceChange.create({
      data: {
        packageId: created.id,
        oldPrice: null,
        newPrice: p.price,
        currency: "NGN",
        reason: "Initial price supplied by the business owner",
      },
    });
    console.log(`✓ Created ${p.name} — ₦${Number(p.price).toLocaleString("en-NG")}`);
  }

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const exists = await prisma.adminUser.findUnique({ where: { email } });
    if (!exists) {
      await prisma.adminUser.create({
        data: { email, name: "Owner", role: AdminRole.OWNER, passwordHash: await bcrypt.hash(password, 12) },
      });
      console.log(`✓ Created owner account ${email} — change this password after first login`);
    }
  } else {
    console.log("! SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — no admin account created");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
