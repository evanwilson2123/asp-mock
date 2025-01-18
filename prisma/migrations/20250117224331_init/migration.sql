-- CreateTable
CREATE TABLE "BlastMotion" (
    "id" SERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "athlete" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionName" TEXT,
    "equipment" TEXT[],
    "handedness" TEXT[],
    "swingDetails" TEXT[],
    "planeScore" DOUBLE PRECISION[],
    "connectionScore" DOUBLE PRECISION[],
    "rotationScore" DOUBLE PRECISION[],
    "batSpeed" DOUBLE PRECISION[],
    "rotationalAcceleration" DOUBLE PRECISION[],
    "onPlaneEfficiency" DOUBLE PRECISION[],
    "attackAngle" DOUBLE PRECISION[],
    "earlyConnection" DOUBLE PRECISION[],
    "connectionAtImpact" DOUBLE PRECISION[],
    "verticalBatAngle" DOUBLE PRECISION[],
    "power" DOUBLE PRECISION[],
    "timeToContact" DOUBLE PRECISION[],
    "peakHandSpeed" DOUBLE PRECISION[],

    CONSTRAINT "BlastMotion_pkey" PRIMARY KEY ("id")
);
