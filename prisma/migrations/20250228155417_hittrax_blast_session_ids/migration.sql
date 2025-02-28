/*
  Warnings:

  - Added the required column `blastSessionId` to the `HittraxBlast` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hittraxSessionId` to the `HittraxBlast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HittraxBlast" ADD COLUMN     "blastSessionId" TEXT NOT NULL,
ADD COLUMN     "hittraxSessionId" TEXT NOT NULL;
