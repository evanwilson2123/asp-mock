/*
  Warnings:

  - Added the required column `athleteId` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `blobUrl` to the `Assessment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "athleteId" TEXT NOT NULL,
ADD COLUMN     "blobUrl" TEXT NOT NULL;
