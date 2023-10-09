/*
  Warnings:

  - You are about to drop the column `connectionStatus` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `currentLocation` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "connectionStatus",
DROP COLUMN "currentLocation";

-- DropEnum
DROP TYPE "ConnectionStatus";

-- DropEnum
DROP TYPE "Location";
