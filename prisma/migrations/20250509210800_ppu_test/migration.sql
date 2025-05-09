-- CreateTable
CREATE TABLE "ForcePPU" (
    "id" SERIAL NOT NULL,
    "athlete" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "bw" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "takeoffPeakForceN" DOUBLE PRECISION NOT NULL,
    "eccentricPeakForce" DOUBLE PRECISION NOT NULL,
    "takeoffPeakForceAsym" TEXT NOT NULL,
    "eccentricPeakForceAsym" TEXT NOT NULL,

    CONSTRAINT "ForcePPU_pkey" PRIMARY KEY ("id")
);
