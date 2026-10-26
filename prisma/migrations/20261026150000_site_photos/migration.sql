-- CreateTable
CREATE TABLE "SitePhoto" (
    "slot" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "credit" TEXT,
    "creditUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitePhoto_pkey" PRIMARY KEY ("slot")
);

