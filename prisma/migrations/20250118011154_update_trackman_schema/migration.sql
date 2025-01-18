-- CreateTable
CREATE TABLE "Trackman" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "athleteId" TEXT,
    "pitchReleaseSpeed" DOUBLE PRECISION,
    "pitchType" TEXT,
    "pitcherName" TEXT,
    "releaseHeight" DOUBLE PRECISION,
    "releaseSide" DOUBLE PRECISION,
    "extension" DOUBLE PRECISION,
    "tilt" TEXT,
    "measuredTilt" TEXT,
    "gyro" DOUBLE PRECISION,
    "spinEfficiency" DOUBLE PRECISION,
    "inducedVerticalBreak" DOUBLE PRECISION,
    "horizontalBreak" DOUBLE PRECISION,
    "verticalApproachAngle" DOUBLE PRECISION,
    "horizontalApproachAngle" DOUBLE PRECISION,
    "locationHeight" DOUBLE PRECISION,
    "locationSide" DOUBLE PRECISION,
    "zoneLocation" TEXT,
    "spinRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trackman_pkey" PRIMARY KEY ("id")
);
