/**
 * AI Engine Configuration
 * Uses LangChain with high-performance LLMs
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.warn(
    "⚠️  GOOGLE_AI_API_KEY not configured - LLM agents will be disabled",
  );
}

/**
 * Single lightweight model for all agent operations.
 * Fast, efficient reasoning model within operational limits.
 */
export const flashModel = new ChatGoogleGenerativeAI({
  apiKey: apiKey,
  model: "gemini-2.5-flash-lite",
  temperature: 0.1,
  maxOutputTokens: 2048,
  topK: 40,
  topP: 0.95,
});

/**
 * Alias — decision.ts imports proModel; keep it pointing to Flash
 * as requested by the user to avoid using "Pro".
 */
export const proModel = flashModel;

/**
 * Check if LLM is available
 */
export function isLLMAvailable(): boolean {
  return !!apiKey;
}

/**
 * Daily usage tracker to stay within free tier
 */
class UsageTracker {
  private dailyTokens = 0;
  private dailyRequests = 0;
  private lastReset = new Date().toDateString();

  // Free tier limits (approximate)
  private readonly MAX_DAILY_TOKENS = 1_000_000; // ~1M tokens/day free
  private readonly MAX_DAILY_REQUESTS = 1500;

  checkAndIncrement(estimatedTokens: number): boolean {
    const today = new Date().toDateString();

    // Reset daily counters
    if (today !== this.lastReset) {
      this.dailyTokens = 0;
      this.dailyRequests = 0;
      this.lastReset = today;
    }

    // Check if within limits
    if (
      this.dailyTokens + estimatedTokens > this.MAX_DAILY_TOKENS ||
      this.dailyRequests >= this.MAX_DAILY_REQUESTS
    ) {
      console.warn(
        "⚠️  Daily LLM quota reached, falling back to rule-based logic",
      );
      return false;
    }

    this.dailyTokens += estimatedTokens;
    this.dailyRequests += 1;
    return true;
  }

  getUsage() {
    return {
      tokens: this.dailyTokens,
      requests: this.dailyRequests,
      percentage: (this.dailyTokens / this.MAX_DAILY_TOKENS) * 100,
    };
  }
}

export const usageTracker = new UsageTracker();
