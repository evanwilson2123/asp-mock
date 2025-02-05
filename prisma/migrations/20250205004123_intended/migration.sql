-- CreateTable
CREATE TABLE "Intended" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "intendedX" DOUBLE PRECISION NOT NULL,
    "intendedY" DOUBLE PRECISION NOT NULL,
    "actualX" DOUBLE PRECISION NOT NULL,
    "actualY" DOUBLE PRECISION NOT NULL,
    "distanceIn" DOUBLE PRECISION NOT NULL,
    "distancePer" DOUBLE PRECISION NOT NULL,
    "playLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intended_pkey" PRIMARY KEY ("id")
);
