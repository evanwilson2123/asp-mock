/*
  Warnings:

  - Added the required column `attackAngle` to the `HittraxBlast` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exitVelo` to the `HittraxBlast` table without a default value. This is not possible if the table is not empty.
  - Added the required column `launchAngle` to the `HittraxBlast` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planeEfficiency` to the `HittraxBlast` table without a default value. This is not possible if the table is not empty.
  - Added the required column `potentialVelo` to the `HittraxBlast` table without a default value. This is not possible if the table is not empty.
  - Added the required column `result` to the `HittraxBlast` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vertBatAngle` to the `HittraxBlast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HittraxBlast" ADD COLUMN     "attackAngle" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "exitVelo" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "launchAngle" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "planeEfficiency" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "potentialVelo" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "result" TEXT NOT NULL,
ADD COLUMN     "vertBatAngle" DOUBLE PRECISION NOT NULL;
