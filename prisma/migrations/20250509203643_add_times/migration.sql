/*
  Warnings:

  - Added the required column `time` to the `ForceCMJ` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `ForceHop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `ForceIMTP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `ForceSJ` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ForceCMJ" ADD COLUMN     "time" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ForceHop" ADD COLUMN     "time" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ForceIMTP" ADD COLUMN     "time" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ForceSJ" ADD COLUMN     "time" TEXT NOT NULL;
