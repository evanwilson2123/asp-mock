-- CreateTable
CREATE TABLE "HittraxBlast" (
    "id" SERIAL NOT NULL,
    "blastId" INTEGER NOT NULL,
    "hittraxId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HittraxBlast_pkey" PRIMARY KEY ("id")
);
