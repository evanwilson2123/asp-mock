/*
  Warnings:

  - Added the required column `swingId` to the `BlastMotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `swingId` to the `HitTrax` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BlastMotion" ADD COLUMN     "swingId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "HitTrax" ADD COLUMN     "swingId" TEXT NOT NULL;
