import type { Response } from "express";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleError(
  error: unknown,
  res: Response,
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  console.error("Unexpected error:", error);

  res.status(500).json({
    message: "Internal server error",
  });
}