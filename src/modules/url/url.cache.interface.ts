export interface CachedUrl {
  id: bigint;
  shortCode: string;
  longUrl: string;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface UrlCacheInterface {
  get(shortCode: string): Promise<CachedUrl | null>;

  set(shortCode: string, url: CachedUrl): Promise<void>;

  delete(shortCode: string): Promise<void>;
}