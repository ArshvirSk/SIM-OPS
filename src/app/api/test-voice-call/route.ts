/**
 * Test Voice Call Endpoint
 * Use this to test Twilio voice call integration
 */

import { actionExecutor } from "@/lib/actions/executor";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        // Optional: Add authentication/authorization here
        const authHeader = req.headers.get("authorization");
        const expectedSecret = process.env.TEST_API_SECRET || "test-secret-123";
        
        if (authHeader !== `Bearer ${expectedSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        
        // Default test data
        const testData = {
            customer_id: body.customer_id || "test_customer_123",
            churn_probability: body.churn_probability || 0.95,
            risk_level: body.risk_level || "critical",
            contributing_factors: body.contributing_factors || [
                { factor: "Low engagement", importance: 45 },
                { factor: "Payment failures", importance: 35 },
                { factor: "High support tickets", importance: 20 },
            ],
            recommended_actions: body.recommended_actions || [
                "Contact customer immediately",
                "Offer retention discount",
                "Schedule executive call",
            ],
        };

        console.log("🧪 Testing voice call with data:", testData);

        // Execute action (will trigger voice call for critical severity)
        const success = await actionExecutor.execute({
            type: "churn_alert",
            severity: body.severity || "critical",
            data: testData,
        });

        if (success) {
            return NextResponse.json({
                success: true,
                message: "Voice call test initiated",
                data: testData,
                note: "Check your phone for incoming call and database for logs",
            });
        } else {
            return NextResponse.json({
                success: false,
                message: "Voice call test failed",
                note: "Check server logs for details",
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Test voice call error:", error);
        return NextResponse.json(
            { 
                success: false, 
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    return NextResponse.json({
        message: "Voice Call Test Endpoint",
        usage: {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer YOUR_TEST_API_SECRET"
            },
            body: {
                customer_id: "optional - defaults to test_customer_123",
                churn_probability: "optional - defaults to 0.95",
                severity: "optional - defaults to 'critical'",
                risk_level: "optional - defaults to 'critical'",
            },
            example: `curl -X POST http://localhost:3000/api/test-voice-call \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-secret-123" \\
  -d '{
    "customer_id": "cust_456",
    "churn_probability": 0.92,
    "severity": "critical"
  }'`
        },
        configuration: {
            required_env_vars: [
                "TWILIO_ACCOUNT_SID",
                "TWILIO_AUTH_TOKEN",
                "TWILIO_PHONE_NUMBER",
                "ALERT_PHONE_NUMBER or ACCOUNT_MANAGER_PHONE"
            ],
            optional_env_vars: [
                "TEST_API_SECRET (defaults to 'test-secret-123')"
            ]
        },
        notes: [
            "Voice calls are only made for 'critical' severity",
            "Check TWILIO_VOICE_SETUP.md for complete setup instructions",
            "Verify Twilio credentials are configured in .env.local",
            "Check activity_logs table for call status"
        ]
    });
}
