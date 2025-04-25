-- CreateTable
CREATE TABLE "WeightLog" (
    "id" SERIAL NOT NULL,
    "athlete" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeightLog_pkey" PRIMARY KEY ("id")
);
