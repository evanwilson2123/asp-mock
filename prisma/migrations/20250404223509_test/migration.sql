-- CreateTable
CREATE TABLE "GoalEntry" (
    "id" SERIAL NOT NULL,
    "athlete" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalEntry_pkey" PRIMARY KEY ("id")
);
