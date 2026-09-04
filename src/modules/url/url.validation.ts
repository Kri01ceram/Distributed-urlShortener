import { AppError } from "../../config/error";

export function validateLongUrl(longUrl: string): void {
  try {
    const url = new URL(longUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error();
    }
  } catch {
    throw new AppError(400, "Invalid URL");
  }
}

export function validateExpiresAt(
  expiresAt?: string | Date | null,
): Date | null {
  if (!expiresAt) {
    return null;
  }

  const parsedDate =
    expiresAt instanceof Date
      ? expiresAt
      : new Date(expiresAt);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(
      400,
      "Invalid expiration date",
    );
  }

  if (parsedDate <= new Date()) {
    throw new AppError(
      400,
      "Expiration date must be in the future",
    );
  }

  return parsedDate;
}