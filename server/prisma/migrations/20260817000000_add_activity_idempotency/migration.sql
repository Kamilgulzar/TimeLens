-- Add idempotency support for browser-extension activity events.
-- clientEventId is generated once per tracked session by the tracking client
-- and makes retries safe (unique per user).

ALTER TABLE "Activity" ADD COLUMN "clientEventId" TEXT;

CREATE UNIQUE INDEX "Activity_userId_clientEventId_key" ON "Activity"("userId", "clientEventId");

CREATE INDEX "Activity_userId_startTime_idx" ON "Activity"("userId", "startTime");