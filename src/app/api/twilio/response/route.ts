/**
 * Twilio Voice Response Handler
 * Handles user responses during voice calls (e.g., pressing 1 to acknowledge)
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const digits = formData.get("Digits");
        const callSid = formData.get("CallSid");
        const from = formData.get("From");

        console.log(`📞 Twilio response received: Digits=${digits}, CallSid=${callSid}`);

        const supabase = createClient();

        // Log the response
        await supabase.from("activity_logs").insert({
            type: "voice_call_response",
            source: "twilio",
            message: `User pressed ${digits} during call ${callSid}`,
            metadata: {
                call_sid: callSid,
                digits: digits,
                from: from,
                timestamp: new Date().toISOString(),
            },
        });

        // Generate TwiML response based on user input
        let twimlResponse = "";

        if (digits === "1") {
            // User acknowledged the alert
            twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">Thank you for acknowledging this alert. The incident has been marked as acknowledged. Goodbye.</Say>
</Response>`;

            // Update alert status in database
            await supabase.from("risk_alerts").update({
                status: "acknowledged",
                acknowledged_at: new Date().toISOString(),
            }).eq("status", "active").order("created_at", { ascending: false }).limit(1);

        } else if (digits === "2") {
            // User wants to escalate
            twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">This alert has been escalated to management. You will receive a follow-up shortly. Goodbye.</Say>
</Response>`;

            // Log escalation
            await supabase.from("activity_logs").insert({
                type: "alert_escalated",
                source: "voice_call",
                message: `Alert escalated via voice call ${callSid}`,
                metadata: {
                    call_sid: callSid,
                    escalated_by: from,
                },
            });

            // TODO: Trigger escalation workflow (send to management, create high-priority ticket, etc.)

        } else {
            // Invalid input
            twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">Invalid input. Please call back if you need assistance. Goodbye.</Say>
</Response>`;
        }

        return new NextResponse(twimlResponse, {
            status: 200,
            headers: {
                "Content-Type": "text/xml",
            },
        });

    } catch (error) {
        console.error("Twilio response handler error:", error);
        
        // Return error TwiML
        const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-US">An error occurred processing your response. Please try again later. Goodbye.</Say>
</Response>`;

        return new NextResponse(errorTwiml, {
            status: 200,
            headers: {
                "Content-Type": "text/xml",
            },
        });
    }
}
