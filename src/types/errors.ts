/**
 * Error Type Hierarchy
 * Provides typed error classes and utilities for safe error handling
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class APIError extends AppError {
  constructor(
    message: string,
    public readonly service: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message, "API_ERROR", statusCode, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "DATABASE_ERROR", 500, details);
  }
}

export class MLServiceError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "ML_SERVICE_ERROR", 500, details);
  }
}

export class WorkflowError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "WORKFLOW_ERROR", 500, details);
  }
}

export class IntegrationError extends AppError {
  constructor(
    message: string,
    public readonly integration: string,
    details?: Record<string, unknown>
  ) {
    super(message, "INTEGRATION_ERROR", 500, details);
  }
}

// Type guard for Error objects
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// Type guard for AppError objects
export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

// Type guard for ValidationError objects
export function isValidationError(value: unknown): value is ValidationError {
  return value instanceof ValidationError;
}

// Type guard for APIError objects
export function isAPIError(value: unknown): value is APIError {
  return value instanceof APIError;
}

// Type guard for DatabaseError objects
export function isDatabaseError(value: unknown): value is DatabaseError {
  return value instanceof DatabaseError;
}

// Type guard for MLServiceError objects
export function isMLServiceError(value: unknown): value is MLServiceError {
  return value instanceof MLServiceError;
}

// Safe error message extraction
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "An unknown error occurred";
}

// Safe error code extraction
export function getErrorCode(error: unknown): string | undefined {
  if (isAppError(error)) {
    return error.code;
  }
  if (error && typeof error === "object" && "code" in error) {
    return String(error.code);
  }
  return undefined;
}

// Safe error details extraction
export function getErrorDetails(
  error: unknown
): Record<string, unknown> | undefined {
  if (isAppError(error)) {
    return error.details;
  }
  return undefined;
}

// Safe error status code extraction
export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}

// Convert unknown error to AppError
export function toAppError(error: unknown, defaultCode = "UNKNOWN_ERROR"): AppError {
  if (isAppError(error)) {
    return error;
  }
  if (isError(error)) {
    return new AppError(error.message, defaultCode);
  }
  return new AppError(getErrorMessage(error), defaultCode);
}
