/*
  Warnings:

  - Added the required column `squaredUpRate` to the `HittraxBlast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HittraxBlast" ADD COLUMN     "squaredUpRate" DOUBLE PRECISION NOT NULL;
