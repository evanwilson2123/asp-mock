/*
  Warnings:

  - Added the required column `pitchType` to the `Intended` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Intended" ADD COLUMN     "pitchType" TEXT NOT NULL;
