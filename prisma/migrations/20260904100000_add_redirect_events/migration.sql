-- CreateTable
CREATE TABLE "RedirectEvent" (
    "id" BIGSERIAL NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "urlId" BIGINT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "userAgent" TEXT,
    "referer" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RedirectEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RedirectEvent_eventId_key" ON "RedirectEvent"("eventId");

-- CreateIndex
CREATE INDEX "RedirectEvent_urlId_idx" ON "RedirectEvent"("urlId");

-- CreateIndex
CREATE INDEX "RedirectEvent_occurredAt_idx" ON "RedirectEvent"("occurredAt");