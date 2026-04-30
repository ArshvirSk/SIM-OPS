"use client";

import { mlClient } from "@/lib/ml/client";
import type {
  ChurnPredictionRequest,
  AnomalyDetectionRequest,
  RevenueForecastRequest,
  CLVPredictionRequest,
} from "@/lib/ml/client";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useChurnPrediction() {
  return useMutation({
    mutationFn: (request: ChurnPredictionRequest) =>
      mlClient.predictChurn(request),
  });
}

export function useAnomalyDetection() {
  return useMutation({
    mutationFn: (request: AnomalyDetectionRequest) =>
      mlClient.detectAnomalies(request),
  });
}

export function useRevenueForecast() {
  return useMutation({
    mutationFn: (request: RevenueForecastRequest) =>
      mlClient.forecastRevenue(request),
  });
}

export function useCLVPrediction() {
  return useMutation({
    mutationFn: (request: CLVPredictionRequest) => mlClient.predictCLV(request),
  });
}

export function useMLHealth() {
  return useQuery({
    queryKey: ["ml-health"],
    queryFn: () => mlClient.healthCheck(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1,
  });
}
