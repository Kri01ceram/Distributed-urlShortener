import { AppError } from "../../config/error";
export function validateLongUrl(
  longUrl: unknown
): asserts longUrl is string {
  if (typeof longUrl !== "string" || longUrl.trim().length === 0) {
    throw new AppError(400, "longUrl is required");
  }

  let url: URL;

  try {
    url = new URL(longUrl);
  } catch {
    throw new AppError(
      400,
      "longUrl must be a valid URL"
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError(
      400,
      "Only HTTP and HTTPS URLs are supported"
    );
  }
}

export function validateExpiresAt(
  expiresAt: unknown
): Date | undefined {
  if (expiresAt === undefined) {
    return undefined;
  }

  if (typeof expiresAt !== "string") {
    throw new AppError(
      400,
      "expiresAt must be a valid ISO date string"
    );
  }

  const date = new Date(expiresAt);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(
      400,
      "expiresAt must be a valid ISO date string"
    );
  }

  if (date.getTime() <= Date.now()) {
    throw new AppError(
      400,
      "expiresAt must be in the future"
    );
  }

  return date;
}