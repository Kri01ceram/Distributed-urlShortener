import type { ErrorRequestHandler } from "express";

import { AppError } from "../config/error"

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.name,
      message: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    error: "InternalServerError",
    message: "Something went wrong",
  });
};