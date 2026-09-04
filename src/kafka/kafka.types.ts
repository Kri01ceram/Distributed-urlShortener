export type UrlRedirectedEvent = {
  eventId: string;
  eventType: "url.redirected";
  urlId: string;
  shortCode: string;
  timestamp: string;
  userAgent?: string;
  referer?: string;
};