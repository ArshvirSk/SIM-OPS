/**
 * Cron API Route: Weekly State of the Startup Report
 * Automatically generates and delivers executive reports every Monday at 9 AM
 */

import { actionExecutor } from "@/lib/actions/executor";
import { createClient } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 minutes timeout

/**
 * POST /api/cron/weekly-report
 * Generates comprehensive weekly business intelligence report
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
        console.log("📊 Generating weekly State of the Startup report...");

        const supabase = createClient();

        // Calculate date ranges
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Collect metrics
        const report = {
            title: `State of the Startup - Week of ${weekAgo.toLocaleDateString()}`,
            generated_at: now.toISOString(),
            summary: "",
            sections: {
                customer_health: await generateCustomerHealth(supabase, weekAgo),
                churn_analysis: await generateChurnAnalysis(supabase, weekAgo),
                revenue_forecast: await generateRevenueForecast(supabase),
                anomalies: await generateAnomaliesReport(supabase, weekAgo),
                top_risks: await generateTopRisks(supabase),
                agent_performance: await generateAgentPerformance(supabase, weekAgo),
            },
        };

        // Generate executive summary
        report.summary = generateExecutiveSummary(report.sections);

        // Log agent decision
        await supabase.from("agent_decisions").insert({
            agent_id: "a5555555-5555-4555-8555-555555555555", // Report Generator agent
            decision: "Generated weekly State of the Startup report",
            reasoning: {
                steps: [
                    "Collected weekly metrics",
                    "Analyzed customer health",
                    "Identified top risks",
                    "Generated executive summary",
                ],
                data_points: Object.keys(report.sections).length,
            },
            confidence: 95.0,
            severity: "info",
            context: {
                report_sections: Object.keys(report.sections).length,
                top_risks: report.sections.top_risks.length,
            },
            outcome: "success",
            executed_at: new Date().toISOString(),
        });

        // Deliver report via email and Slack
        await actionExecutor.execute({
            type: "report",
            severity: "low",
            data: report,
        });

        const executionTime = Date.now() - startTime;

        console.log(`✅ Weekly report generated and delivered`);
        console.log(`   - Execution time: ${executionTime}ms`);

        return NextResponse.json({
            success: true,
            message: "Weekly report generated and delivered",
            report: {
                title: report.title,
                sections: Object.keys(report.sections),
                execution_time_ms: executionTime,
            },
        });
    } catch (error) {
        console.error("Weekly report generation error:", error);
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
 * Generate customer health metrics
 */
async function generateCustomerHealth(supabase: any, since: Date) {
    const { count: totalCustomers } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

    const { count: activeCustomers } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .gte("last_login", since.toISOString());

    const { data: newCustomers } = await supabase
        .from("customers")
        .select("id")
        .gte("created_at", since.toISOString());

    return {
        total_customers: totalCustomers || 0,
        active_customers: activeCustomers || 0,
        new_customers: newCustomers?.length || 0,
        activity_rate: totalCustomers
            ? ((activeCustomers || 0) / totalCustomers) * 100
            : 0,
    };
}

/**
 * Generate churn analysis
 */
async function generateChurnAnalysis(supabase: any, since: Date) {
    const { data: predictions } = await supabase
        .from("ml_predictions")
        .select("*")
        .eq("prediction_type", "churn")
        .gte("created_at", since.toISOString());

    if (!predictions || predictions.length === 0) {
        return {
            total_predictions: 0,
            high_risk_count: 0,
            average_churn_probability: 0,
        };
    }

    const highRisk = predictions.filter(
        (p: any) => p.prediction_data?.churn_probability > 0.7
    );

    const avgChurn =
        predictions.reduce(
            (sum: number, p: any) => sum + (p.prediction_data?.churn_probability || 0),
            0
        ) / predictions.length;

    return {
        total_predictions: predictions.length,
        high_risk_count: highRisk.length,
        average_churn_probability: avgChurn,
        high_risk_percentage: (highRisk.length / predictions.length) * 100,
    };
}

/**
 * Generate revenue forecast
 */
async function generateRevenueForecast(supabase: any) {
    const { data: clvPredictions } = await supabase
        .from("ml_predictions")
        .select("*")
        .eq("prediction_type", "clv")
        .order("created_at", { ascending: false })
        .limit(100);

    if (!clvPredictions || clvPredictions.length === 0) {
        return {
            projected_30d_clv: 0,
            total_customer_lifetime_value: 0,
        };
    }

    const totalCLV = clvPredictions.reduce(
        (sum: number, p: any) => sum + (p.prediction_data?.predicted_clv || 0),
        0
    );

    return {
        projected_30d_clv: totalCLV / 12, // Rough monthly estimate
        total_customer_lifetime_value: totalCLV,
        customers_analyzed: clvPredictions.length,
    };
}

/**
 * Generate anomalies report
 */
async function generateAnomaliesReport(supabase: any, since: Date) {
    const { data: anomalies } = await supabase
        .from("ml_predictions")
        .select("*")
        .eq("prediction_type", "anomaly")
        .gte("created_at", since.toISOString());

    if (!anomalies || anomalies.length === 0) {
        return {
            total_anomalies: 0,
            high_severity: 0,
            metrics_affected: [],
        };
    }

    const highSeverity = anomalies.filter(
        (a: any) => a.prediction_data?.severity === "high"
    );

    const metricsAffected = [
        ...new Set(anomalies.map((a: any) => a.prediction_data?.metric_name)),
    ];

    return {
        total_anomalies: anomalies.length,
        high_severity: highSeverity.length,
        metrics_affected: metricsAffected,
    };
}

/**
 * Generate top risks
 */
async function generateTopRisks(supabase: any) {
    const { data: risks } = await supabase
        .from("ml_predictions")
        .select("*")
        .eq("prediction_type", "churn")
        .order("created_at", { ascending: false })
        .limit(10);

    return (
        risks
            ?.filter((r: any) => r.prediction_data?.churn_probability > 0.7)
            .map((r: any) => ({
                customer_id: r.customer_id,
                churn_probability: r.prediction_data?.churn_probability,
                risk_level: r.prediction_data?.risk_level,
            })) || []
    );
}

/**
 * Generate agent performance metrics
 */
async function generateAgentPerformance(supabase: any, since: Date) {
    const { data: decisions } = await supabase
        .from("agent_decisions")
        .select("agent_id, outcome")
        .gte("created_at", since.toISOString());

    if (!decisions || decisions.length === 0) {
        return {
            total_decisions: 0,
            success_rate: 0,
        };
    }

    const successful = decisions.filter((d: any) => d.outcome === "success").length;

    return {
        total_decisions: decisions.length,
        success_rate: (successful / decisions.length) * 100,
        agents_active: [...new Set(decisions.map((d: any) => d.agent_id))].length,
    };
}

/**
 * Generate executive summary
 */
function generateExecutiveSummary(sections: any): string {
    const parts = [];

    if (sections.customer_health) {
        parts.push(
            `Active customers: ${sections.customer_health.active_customers}/${sections.customer_health.total_customers} (${(sections.customer_health.activity_rate || 0).toFixed(0)}%)`
        );
        parts.push(`New customers: ${sections.customer_health.new_customers}`);
    }

    if (sections.churn_analysis) {
        parts.push(
            `High churn risk: ${sections.churn_analysis.high_risk_count} customers (${(sections.churn_analysis.high_risk_percentage || 0).toFixed(0)}%)`
        );
    }

    if (sections.anomalies) {
        parts.push(
            `Anomalies detected: ${sections.anomalies.total_anomalies} (${sections.anomalies.high_severity} high severity)`
        );
    }

    if (sections.agent_performance) {
        parts.push(
            `Agent decisions: ${sections.agent_performance.total_decisions} (${(sections.agent_performance.success_rate || 0).toFixed(0)}% success rate)`
        );
    }

    return parts.join(". ");
}

export async function GET() {
    return NextResponse.json({
        service: "Weekly State of the Startup Report",
        status: "ready",
        schedule: "Every Monday at 9 AM",
    });
}
