/*
  Warnings:

  - You are about to drop the column `sessionName` on the `BlastMotion` table. All the data in the column will be lost.
  - The `planeScore` column on the `BlastMotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `connectionScore` column on the `BlastMotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `rotationScore` column on the `BlastMotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `batSpeed` column on the `BlastMotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `rotationalAcceleration` column on the `BlastMotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `onPlaneEfficiency` column on the `BlastMotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `attackAngle` column on the `BlastMotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `earlyConnection` column on the `BlastMotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `connectionAtImpact` column on the `BlastMotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `verticalBatAngle` column on the `BlastMotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `power` column on the `BlastMotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `timeToContact` column on the `BlastMotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `peakHandSpeed` column on the `BlastMotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "BlastMotion" DROP COLUMN "sessionName",
ALTER COLUMN "equipment" DROP NOT NULL,
ALTER COLUMN "equipment" SET DATA TYPE TEXT,
ALTER COLUMN "handedness" DROP NOT NULL,
ALTER COLUMN "handedness" SET DATA TYPE TEXT,
ALTER COLUMN "swingDetails" DROP NOT NULL,
ALTER COLUMN "swingDetails" SET DATA TYPE TEXT,
DROP COLUMN "planeScore",
ADD COLUMN     "planeScore" DOUBLE PRECISION,
DROP COLUMN "connectionScore",
ADD COLUMN     "connectionScore" DOUBLE PRECISION,
DROP COLUMN "rotationScore",
ADD COLUMN     "rotationScore" DOUBLE PRECISION,
DROP COLUMN "batSpeed",
ADD COLUMN     "batSpeed" DOUBLE PRECISION,
DROP COLUMN "rotationalAcceleration",
ADD COLUMN     "rotationalAcceleration" DOUBLE PRECISION,
DROP COLUMN "onPlaneEfficiency",
ADD COLUMN     "onPlaneEfficiency" DOUBLE PRECISION,
DROP COLUMN "attackAngle",
ADD COLUMN     "attackAngle" DOUBLE PRECISION,
DROP COLUMN "earlyConnection",
ADD COLUMN     "earlyConnection" DOUBLE PRECISION,
DROP COLUMN "connectionAtImpact",
ADD COLUMN     "connectionAtImpact" DOUBLE PRECISION,
DROP COLUMN "verticalBatAngle",
ADD COLUMN     "verticalBatAngle" DOUBLE PRECISION,
DROP COLUMN "power",
ADD COLUMN     "power" DOUBLE PRECISION,
DROP COLUMN "timeToContact",
ADD COLUMN     "timeToContact" DOUBLE PRECISION,
DROP COLUMN "peakHandSpeed",
ADD COLUMN     "peakHandSpeed" DOUBLE PRECISION;
