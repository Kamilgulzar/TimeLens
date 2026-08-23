-- CreateTable
CREATE TABLE "ExtensionStatus" (
    "userId" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "trackingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "browser" TEXT NOT NULL DEFAULT 'Chrome',
    "version" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtensionStatus_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ExtensionControl" (
    "userId" TEXT NOT NULL,
    "trackingEnabled" BOOLEAN,
    "disconnect" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtensionControl_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "ExtensionStatus" ADD CONSTRAINT "ExtensionStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionControl" ADD CONSTRAINT "ExtensionControl_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
