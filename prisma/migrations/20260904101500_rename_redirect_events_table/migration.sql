ALTER TABLE "RedirectEvent" RENAME TO "redirect_events";

ALTER INDEX "RedirectEvent_eventId_key" RENAME TO "redirect_events_eventId_key";
ALTER INDEX "RedirectEvent_urlId_idx" RENAME TO "redirect_events_urlId_idx";
ALTER INDEX "RedirectEvent_occurredAt_idx" RENAME TO "redirect_events_occurredAt_idx";