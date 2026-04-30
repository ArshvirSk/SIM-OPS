/**
 * Generic API Client for external integrations
 * Supports any REST API with authentication
 */

import type { APIClientConfig, APIResponse, APIData } from "@/types/api/common";
import { APIError, getErrorMessage, isError } from "@/types/errors";

export class APIClient {
  private config: APIClientConfig & { timeout: number; retries: number };

  constructor(config: APIClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.headers,
    };

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  async get<T extends APIData = APIData>(endpoint: string): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(
          `API request failed: ${response.statusText}`,
          this.config.baseURL,
          response.status
        );
      }

      const data = await response.json() as T;

      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (isError(error) && error.name === "AbortError") {
        throw new APIError(
          `API GET request timeout after ${this.config.timeout}ms`,
          this.config.baseURL,
          408
        );
      }
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError(
        `API GET request failed: ${getErrorMessage(error)}`,
        this.config.baseURL
      );
    }
  }

  async post<T extends APIData = APIData>(
    endpoint: string,
    body?: APIData
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(
          `API request failed: ${response.statusText}`,
          this.config.baseURL,
          response.status
        );
      }

      const data = await response.json() as T;

      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (isError(error) && error.name === "AbortError") {
        throw new APIError(
          `API POST request timeout after ${this.config.timeout}ms`,
          this.config.baseURL,
          408
        );
      }
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError(
        `API POST request failed: ${getErrorMessage(error)}`,
        this.config.baseURL
      );
    }
  }

  async put<T extends APIData = APIData>(
    endpoint: string,
    body?: APIData
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(
          `API request failed: ${response.statusText}`,
          this.config.baseURL,
          response.status
        );
      }

      const data = await response.json() as T;

      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (isError(error) && error.name === "AbortError") {
        throw new APIError(
          `API PUT request timeout after ${this.config.timeout}ms`,
          this.config.baseURL,
          408
        );
      }
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError(
        `API PUT request failed: ${getErrorMessage(error)}`,
        this.config.baseURL
      );
    }
  }

  async delete<T extends APIData = APIData>(endpoint: string): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(
          `API request failed: ${response.statusText}`,
          this.config.baseURL,
          response.status
        );
      }

      const data = response.status !== 204 ? (await response.json() as T) : null as T;

      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (isError(error) && error.name === "AbortError") {
        throw new APIError(
          `API DELETE request timeout after ${this.config.timeout}ms`,
          this.config.baseURL,
          408
        );
      }
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError(
        `API DELETE request failed: ${getErrorMessage(error)}`,
        this.config.baseURL
      );
    }
  }
}

// Re-export types for convenience
export type { APIClientConfig, APIResponse, APIData } from "@/types/api/common";
