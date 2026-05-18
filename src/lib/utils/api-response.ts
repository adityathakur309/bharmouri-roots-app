import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, isAppError, ValidationError } from "./errors";
import { logger } from "./logger";

export interface ApiSuccess<T = unknown> {
  success: true;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  code?: string;
  errors?: unknown;
}

export function successResponse<T>(
  data: T,
  options?: { message?: string; status?: number; meta?: Record<string, unknown> }
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true as const,
      message: options?.message,
      data,
      meta: options?.meta,
    },
    { status: options?.status ?? 200 }
  );
}

export function errorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        errors: error.flatten(),
      },
      { status: 400 }
    );
  }

  if (isAppError(error)) {
    const body: ApiErrorBody = {
      success: false,
      message: error.message,
      code: error.code,
    };
    if (error instanceof ValidationError && error.details) {
      body.errors = error.details;
    }
    return NextResponse.json(body, { status: error.statusCode });
  }

  const detail =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);
  logger.error("Unhandled API error", detail);
  return NextResponse.json(
    {
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    },
    { status: 500 }
  );
}
