/*
  Warnings:

  - Added the required column `athlete` to the `HittraxBlast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HittraxBlast" ADD COLUMN     "athlete" TEXT NOT NULL;
