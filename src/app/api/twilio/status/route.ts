/**
 * Twilio Call Status Webhook Handler
 * Tracks the status of voice calls (initiated, ringing, answered, completed, etc.)
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        
        const callSid = formData.get("CallSid");
        const callStatus = formData.get("CallStatus");
        const to = formData.get("To");
        const from = formData.get("From");
        const duration = formData.get("CallDuration");
        const timestamp = formData.get("Timestamp");

        console.log(`📞 Twilio status update: ${callStatus} for call ${callSid}`);

        const supabase = createClient();

        // Log the status update
        await supabase.from("activity_logs").insert({
            type: "voice_call_status",
            source: "twilio",
            message: `Call ${callSid} status: ${callStatus}`,
            metadata: {
                call_sid: callSid,
                status: callStatus,
                to: to,
                from: from,
                duration: duration,
                timestamp: timestamp,
            },
        });

        // Handle specific statuses
        switch (callStatus) {
            case "completed":
                console.log(`✅ Call ${callSid} completed. Duration: ${duration}s`);
                
                // Check if call was answered (duration > 0)
                if (duration && parseInt(duration as string) > 0) {
                    await supabase.from("activity_logs").insert({
                        type: "alert_delivered",
                        source: "voice_call",
                        message: `Voice alert successfully delivered via call ${callSid}`,
                        metadata: {
                            call_sid: callSid,
                            duration: duration,
                        },
                    });
                } else {
                    // Call was not answered
                    await supabase.from("activity_logs").insert({
                        type: "alert_failed",
                        source: "voice_call",
                        message: `Voice alert not answered for call ${callSid}`,
                        metadata: {
                            call_sid: callSid,
                            reason: "no_answer",
                        },
                    });

                    // TODO: Implement retry logic or escalation
                }
                break;

            case "failed":
            case "busy":
            case "no-answer":
                console.error(`❌ Call ${callSid} failed: ${callStatus}`);
                
                await supabase.from("activity_logs").insert({
                    type: "alert_failed",
                    source: "voice_call",
                    message: `Voice alert failed for call ${callSid}: ${callStatus}`,
                    metadata: {
                        call_sid: callSid,
                        reason: callStatus,
                    },
                });

                // TODO: Implement fallback notification (SMS, email, etc.)
                break;

            case "ringing":
                console.log(`📞 Call ${callSid} is ringing...`);
                break;

            case "in-progress":
                console.log(`📞 Call ${callSid} answered and in progress`);
                break;

            default:
                console.log(`📞 Call ${callSid} status: ${callStatus}`);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Twilio status handler error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
