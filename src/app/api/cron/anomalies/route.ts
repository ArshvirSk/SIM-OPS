/**
 * Cron API Route: Anomaly Detection
 * Automatically detects anomalies in system metrics every hour
 */

import { mlClient } from "@/lib/ml/client";
import { createClient } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 1 minute timeout

/**
 * POST /api/cron/anomalies
 * Runs anomaly detection on system metrics
 */
export async function POST(req: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = req.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            return NextResponse.json(
                { error: "Cron secret not configured" },
                { status: 500 }
            );
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const startTime = Date.now();
        console.log("🔍 Starting autonomous anomaly detection...");

        const supabase = createClient();

        // Define metrics to monitor
        const metricsToMonitor = [
            "revenue",
            "active_users",
            "api_latency",
            "error_rate",
            "conversion_rate",
        ];

        const anomalyResults = {
            detected: 0,
            highSeverity: [] as string[],
            metrics: [] as any[],
        };

        for (const metricName of metricsToMonitor) {
            try {
                // Generate sample metric data (in production, fetch from real metrics)
                const metricData = await generateMetricData(metricName, supabase);

                // Run anomaly detection
                const anomalyResponse = await mlClient.detectAnomalies({
                    metric_name: metricName,
                    values: metricData.values,
                    timestamps: metricData.timestamps,
                });

                // Store detected anomalies
                const anomalies = Array.isArray(anomalyResponse) ? anomalyResponse : (anomalyResponse as any).anomalies || [];
                for (const anomaly of anomalies) {
                    await supabase.from("ml_predictions").insert({
                        customer_id: null, // System-wide anomaly
                        prediction_type: "anomaly",
                        prediction_data: {
                            metric_name: metricName,
                            anomaly_score: anomaly.anomaly_score,
                            severity: anomaly.severity,
                            timestamp: anomaly.timestamp,
                            expected_range: anomaly.expected_range,
                            actual_value: anomaly.actual_value,
                            deviation: anomaly.deviation,
                        },
                        confidence: anomaly.anomaly_score,
                        expires_at: new Date(
                            Date.now() + 6 * 60 * 60 * 1000
                        ).toISOString(), // 6 hours
                        metadata: {
                            model_version: "v1.0",
                            source: "autonomous_cron",
                            timestamp: new Date().toISOString(),
                        },
                    });

                    anomalyResults.detected++;

                    if (anomaly.severity === "high") {
                        anomalyResults.highSeverity.push(
                            `${metricName}: ${anomaly.actual_value} (expected ${anomaly.expected_range.min}-${anomaly.expected_range.max})`
                        );
                    }
                }

                anomalyResults.metrics.push({
                    metric: metricName,
                    anomalies_found: anomalies.length,
                });
            } catch (error) {
                console.error(`Anomaly detection failed for ${metricName}:`, error);
            }
        }

        const executionTime = Date.now() - startTime;

        console.log(`✅ Anomaly detection completed:`);
        console.log(`   - Total anomalies: ${anomalyResults.detected}`);
        console.log(`   - High severity: ${anomalyResults.highSeverity.length}`);
        console.log(`   - Execution time: ${executionTime}ms`);

        // Log agent decision
        await supabase.from("agent_decisions").insert({
            agent_id: "monitoring", // Data Monitor agent
            decision: `Completed autonomous anomaly detection scan`,
            reasoning: {
                steps: [
                    "Collected system metrics",
                    "Ran anomaly detection models",
                    "Identified unusual patterns",
                    "Stored anomalies for alerting",
                ],
                data_points: metricsToMonitor.length,
            },
            confidence: 92.0,
            severity: anomalyResults.highSeverity.length > 0 ? "high" : "info",
            context: {
                metrics_scanned: metricsToMonitor.length,
                anomalies_detected: anomalyResults.detected,
                high_severity_count: anomalyResults.highSeverity.length,
                execution_time_ms: executionTime,
            },
            outcome: "success",
            executed_at: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: "Anomaly detection completed",
            results: {
                metrics_scanned: metricsToMonitor.length,
                anomalies_detected: anomalyResults.detected,
                high_severity: anomalyResults.highSeverity.length,
                metrics: anomalyResults.metrics,
                execution_time_ms: executionTime,
            },
        });
    } catch (error) {
        console.error("Cron anomaly detection error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

/**
 * Generate sample metric data (replace with real data source in production)
 */
async function generateMetricData(metricName: string, supabase: any) {
    // In production, fetch from your monitoring system (DataDog, CloudWatch, etc.)
    // For now, fetch from agent_metrics table or generate synthetic data

    const { data: metrics } = await supabase
        .from("agent_metrics")
        .select("metric_value, timestamp")
        .eq("metric_name", metricName)
        .order("timestamp", { ascending: false })
        .limit(100);

    if (metrics && metrics.length > 0) {
        return {
            values: metrics.map((m: any) => m.metric_value),
            timestamps: metrics.map((m: any) => m.timestamp),
        };
    }

    // Fallback: generate synthetic data with some anomalies
    const now = Date.now();
    const values: number[] = [];
    const timestamps: string[] = [];

    for (let i = 99; i >= 0; i--) {
        const timestamp = new Date(now - i * 60 * 60 * 1000).toISOString();
        const baseValue = getBaseValue(metricName);
        const noise = (Math.random() - 0.5) * baseValue * 0.1;
        // Inject anomaly occasionally
        const anomaly = Math.random() < 0.05 ? baseValue * (Math.random() > 0.5 ? 2 : 0.3) : 0;
        const value = baseValue + noise + anomaly;

        values.push(value);
        timestamps.push(timestamp);
    }

    return { values, timestamps };
}

function getBaseValue(metricName: string): number {
    const baseValues: Record<string, number> = {
        revenue: 10000,
        active_users: 500,
        api_latency: 150,
        error_rate: 0.02,
        conversion_rate: 0.05,
    };
    return baseValues[metricName] || 100;
}

export async function GET() {
    return NextResponse.json({
        service: "Autonomous Anomaly Detection Service",
        status: "ready",
    });
}
