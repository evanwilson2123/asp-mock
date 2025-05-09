/*
  Warnings:

  - Added the required column `RSImodified` to the `ForceSJ` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bodyWeightPounds` to the `ForceSJ` table without a default value. This is not possible if the table is not empty.
  - Added the required column `concentricRFD` to the `ForceSJ` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jumpHeight` to the `ForceSJ` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ForceSJ" ADD COLUMN     "RSImodified" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "bodyWeightPounds" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "concentricRFD" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "jumpHeight" DOUBLE PRECISION NOT NULL;
