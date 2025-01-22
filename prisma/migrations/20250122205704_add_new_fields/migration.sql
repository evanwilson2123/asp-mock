/*
  Warnings:

  - Added the required column `playLevel` to the `ArmCare` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playLevel` to the `HitTrax` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playLevel` to the `Trackman` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ArmCare" ADD COLUMN     "playLevel" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "BlastMotion" ADD COLUMN     "playLevel" TEXT NOT NULL DEFAULT 'None';

-- AlterTable
ALTER TABLE "HitTrax" ADD COLUMN     "playLevel" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Trackman" ADD COLUMN     "playLevel" TEXT NOT NULL;
