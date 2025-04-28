-- CreateTable
CREATE TABLE "ForceCMJ" (
    "id" SERIAL NOT NULL,
    "athlete" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "bodyWeight" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "addLoad" DOUBLE PRECISION NOT NULL,
    "jmpHeight" DOUBLE PRECISION NOT NULL,
    "lowLimbStiff" DOUBLE PRECISION NOT NULL,
    "peakPowerW" DOUBLE PRECISION NOT NULL,
    "peakPowerBM" DOUBLE PRECISION NOT NULL,
    "eccentricDuration" DOUBLE PRECISION NOT NULL,
    "concretricDuration" DOUBLE PRECISION NOT NULL,
    "RSImodified" DOUBLE PRECISION NOT NULL,
    "counterMovement" DOUBLE PRECISION NOT NULL,
    "CMJstiffness" TEXT NOT NULL,
    "eccentricDeceleration" TEXT NOT NULL,
    "P1concentricImp" TEXT NOT NULL,
    "P2concentricImp" TEXT NOT NULL,
    "concentricPeakForce" TEXT NOT NULL,
    "eccentricPeakForce" TEXT NOT NULL,
    "minimumEccentricForce" TEXT NOT NULL,

    CONSTRAINT "ForceCMJ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForceHop" (
    "id" SERIAL NOT NULL,
    "athlete" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "bw" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "bestActiveStiffness" DOUBLE PRECISION NOT NULL,
    "bestJumpHeight" DOUBLE PRECISION NOT NULL,
    "bestRSIF" DOUBLE PRECISION NOT NULL,
    "bestRSIJ" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ForceHop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForceIMTP" (
    "id" SERIAL NOT NULL,
    "athlete" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "bw" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "netPeakVerticalForce" DOUBLE PRECISION NOT NULL,
    "peakVerticalForce" DOUBLE PRECISION NOT NULL,
    "forceAt100ms" DOUBLE PRECISION NOT NULL,
    "forceAt150ms" DOUBLE PRECISION NOT NULL,
    "forceAt200ms" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ForceIMTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForceSJ" (
    "id" SERIAL NOT NULL,
    "athlete" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "bw" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "additionalLoad" DOUBLE PRECISION NOT NULL,
    "peakPowerW" DOUBLE PRECISION NOT NULL,
    "peakPowerBM" DOUBLE PRECISION NOT NULL,
    "P1concentricImp" TEXT NOT NULL,
    "P2concentricImp" TEXT NOT NULL,

    CONSTRAINT "ForceSJ_pkey" PRIMARY KEY ("id")
);
