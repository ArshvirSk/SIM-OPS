/**
 * ML Service Client
 * Connects Next.js frontend to Python ML backend
 */

import type {
  ChurnPredictionRequest,
  ChurnPredictionResponse,
  ChurnBatchResponse,
  AnomalyDetectionRequest,
  AnomalyDetectionResponse,
  RevenueForecastRequest,
  RevenueForecastResponse,
  CLVPredictionRequest,
  CLVPredictionResponse,
  ModelTrainingRequest,
  ModelTrainingResponse,
  ModelInfoResponse,
  HealthCheckResponse,
} from "@/types/api/ml-service";
import { MLServiceError, getErrorMessage, isError } from "@/types/errors";

const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || "http://localhost:8000";

// Cache configuration
const CACHE_TTL = 3600000; // 1 hour in milliseconds
const REQUEST_TIMEOUT = 30000; // 30 seconds (increased for batch processing)
const MAX_RETRIES = 3;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MLServiceClient {
  private baseUrl: string;
  private cache: Map<string, CacheEntry<unknown>>;
  private cacheTTL: number;

  constructor(baseUrl: string = ML_SERVICE_URL) {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.cacheTTL = CACHE_TTL;
  }

  /**
   * Get cached prediction if available and not expired
   */
  private getCachedPrediction<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Cache a prediction result
   */
  private cachePrediction<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate cache for a specific key or all cache
   */
  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Request with retry logic and timeout
   */
  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = MAX_RETRIES
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        const response = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({ detail: "Unknown error" }));
          const errorMessage = typeof error === "object" && error !== null && "detail" in error
            ? String(error.detail)
            : `HTTP ${response.status}`;
          throw new MLServiceError(errorMessage, { status: response.status });
        }

        return await response.json() as T;
      } catch (error: unknown) {
        // Don't retry on validation errors (400)
        if (isError(error) && error.message.includes("400")) {
          throw new MLServiceError(getErrorMessage(error), { status: 400 });
        }

        // Last attempt, throw error
        if (attempt === retries) {
          console.error(`ML Service request failed after ${retries} attempts:`, error);
          throw new MLServiceError(
            `ML Service unavailable: ${getErrorMessage(error)}`,
            { attempts: retries }
          );
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new MLServiceError("Request failed after all retries");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.requestWithRetry<T>(endpoint, options);
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    return this.request("/health");
  }

  async predictChurn(request: ChurnPredictionRequest): Promise<ChurnPredictionResponse> {
    // Check cache first
    const cacheKey = `churn:${request.customer_id}`;
    const cached = this.getCachedPrediction<ChurnPredictionResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // Make request
    const result = await this.request<ChurnPredictionResponse>("/predict/churn", {
      method: "POST",
      body: JSON.stringify(request),
    });

    // Cache result
    this.cachePrediction(cacheKey, result);

    return result;
  }

  async predictChurnBatch(customers: ChurnPredictionRequest[]): Promise<ChurnBatchResponse> {
    // Batch requests don't use cache (too complex to manage)
    return this.request("/predict/churn/batch", {
      method: "POST",
      body: JSON.stringify({ customers }),
    });
  }

  async detectAnomalies(request: AnomalyDetectionRequest): Promise<AnomalyDetectionResponse> {
    return this.request("/detect/anomalies", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async forecastRevenue(request: RevenueForecastRequest): Promise<RevenueForecastResponse> {
    return this.request("/forecast/revenue", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async predictCLV(request: CLVPredictionRequest): Promise<CLVPredictionResponse> {
    // Check cache first
    const cacheKey = `clv:${request.customer_id}`;
    const cached = this.getCachedPrediction<CLVPredictionResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // Make request
    const result = await this.request<CLVPredictionResponse>("/predict/clv", {
      method: "POST",
      body: JSON.stringify(request),
    });

    // Cache result
    this.cachePrediction(cacheKey, result);

    return result;
  }

  async trainModel(
    modelName: string,
    trainingData: ModelTrainingRequest["training_data"]
  ): Promise<ModelTrainingResponse> {
    return this.request(`/models/train/${modelName}`, {
      method: "POST",
      body: JSON.stringify(trainingData),
    });
  }

  async getModelInfo(modelName: string): Promise<ModelInfoResponse> {
    return this.request(`/models/info/${modelName}`);
  }
}

export const mlClient = new MLServiceClient();

// Re-export types for convenience
export type {
  ChurnPredictionRequest,
  ChurnPredictionResponse,
  AnomalyDetectionRequest,
  AnomalyDetectionResponse,
  RevenueForecastRequest,
  RevenueForecastResponse,
  CLVPredictionRequest,
  CLVPredictionResponse,
};
