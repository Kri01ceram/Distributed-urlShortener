export interface UrlCacheInterface {
  get(shortCode: string): Promise<{
    shortCode: string;
    longUrl: string;
    expiresAt: string | null;
  } | null>;

  set(
    shortCode: string,
    url: {
      shortCode: string;
      longUrl: string;
      expiresAt: Date | null;
    }
  ): Promise<void>;

  delete(shortCode: string): Promise<void>;
}