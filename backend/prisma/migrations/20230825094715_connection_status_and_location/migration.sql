-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "Location" AS ENUM ('CHAT', 'GAME', 'INGAME');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "connectionStatus" "ConnectionStatus" NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "currentLocation" "Location";
