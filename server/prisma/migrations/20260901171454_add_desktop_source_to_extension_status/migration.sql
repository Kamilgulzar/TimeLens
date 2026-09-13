/*
  Warnings:

  - You are about to drop the `AuthCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "ExtensionStatus" ADD COLUMN     "platform" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'browser';

-- DropTable
DROP TABLE "AuthCode";
