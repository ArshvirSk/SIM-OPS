/**
 * Common API Type Definitions
 * Shared types for API clients and responses
 */

// Constrained generic for API data
export type APIData = 
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

// Generic API response wrapper
export interface APIResponse<T extends APIData = APIData> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

// API client configuration
export interface APIClientConfig {
  baseURL: string;
  apiKey?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// HTTP methods
export type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// Request options
export interface RequestOptions {
  method?: HTTPMethod;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// API error response
export interface APIErrorResponse {
  error: {
    message: string;
    code: string;
    status: number;
    details?: Record<string, unknown>;
  };
}

// Type guard for API error responses
export function isAPIErrorResponse(value: unknown): value is APIErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as APIErrorResponse).error === "object" &&
    "message" in (value as APIErrorResponse).error
  );
}

// Success response wrapper
export interface SuccessResponse<T extends APIData = APIData> {
  success: true;
  data: T;
  message?: string;
}

// Error response wrapper
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Combined response type
export type APIResult<T extends APIData = APIData> = SuccessResponse<T> | ErrorResponse;

// Type guard for success responses
export function isSuccessResponse<T extends APIData>(
  response: APIResult<T>
): response is SuccessResponse<T> {
  return response.success === true;
}

// Type guard for error responses
export function isErrorResponse(response: APIResult): response is ErrorResponse {
  return response.success === false;
}

// Webhook payload
export interface WebhookPayload<T extends APIData = APIData> {
  event: string;
  timestamp: string;
  data: T;
  signature?: string;
}

// Rate limit info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

// API response with rate limit
export interface APIResponseWithRateLimit<T extends APIData = APIData>
  extends APIResponse<T> {
  rateLimit: RateLimitInfo;
}
