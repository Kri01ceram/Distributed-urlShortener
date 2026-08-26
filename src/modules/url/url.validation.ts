import { AppError } from "../../config/error";

export function validateLongUrl(longUrl: unknown): asserts longUrl is string {
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