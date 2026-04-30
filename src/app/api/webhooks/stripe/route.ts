/**
 * Stripe Webhook Handler
 * Ingests payment events and updates customer data automatically
 */

import { createClient } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe
 * Handles Stripe payment events
 */
export async function POST(req: NextRequest) {
    try {
        const event = await req.json();

        console.log(`📥 Received Stripe webhook: ${event.type}`);

        const supabase = createClient();

        switch (event.type) {
            case "payment_intent.succeeded":
                await handlePaymentSuccess(event.data.object, supabase);
                break;

            case "payment_intent.payment_failed":
                await handlePaymentFailure(event.data.object, supabase);
                break;

            case "customer.subscription.created":
            case "customer.subscription.updated":
                await handleSubscriptionChange(event.data.object, supabase);
                break;

            case "customer.subscription.deleted":
                await handleSubscriptionCancellation(event.data.object, supabase);
                break;

            case "invoice.payment_succeeded":
                await handleInvoicePayment(event.data.object, supabase);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Stripe webhook error:", error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}

async function handlePaymentSuccess(paymentIntent: any, supabase: any) {
    const customerId = paymentIntent.metadata?.customer_id;
    const amount = paymentIntent.amount / 100; // Convert from cents

    if (!customerId) return;

    // Update customer spend
    const { data: customer } = await supabase
        .from("customers")
        .select("total_spend, total_purchases")
        .eq("id", customerId)
        .single();

    if (customer) {
        await supabase
            .from("customers")
            .update({
                total_spend: (customer.total_spend || 0) + amount,
                total_purchases: (customer.total_purchases || 0) + 1,
                avg_purchase_value:
                    ((customer.total_spend || 0) + amount) /
                    ((customer.total_purchases || 0) + 1),
                last_activity: new Date().toISOString(),
            })
            .eq("id", customerId);

        console.log(`✅ Payment processed for customer ${customerId}: $${amount}`);
    }
}

async function handlePaymentFailure(paymentIntent: any, supabase: any) {
    const customerId = paymentIntent.metadata?.customer_id;

    if (!customerId) return;

    // Increment payment failures
    await supabase.rpc("increment_payment_failures", {
        p_customer_id: customerId,
    });

    console.log(`⚠️ Payment failed for customer ${customerId}`);

    // Trigger alert for multiple failures
    const { data: customer } = await supabase
        .from("customers")
        .select("payment_failures")
        .eq("id", customerId)
        .single();

    if (customer && customer.payment_failures >= 3) {
        // High-priority alert - multiple payment failures
        console.log(
            `🚨 Multiple payment failures detected for customer ${customerId}`
        );
    }
}

async function handleSubscriptionChange(subscription: any, supabase: any) {
    const customerId = subscription.metadata?.customer_id;

    if (!customerId) return;

    await supabase
        .from("customers")
        .update({
            last_activity: new Date().toISOString(),
        })
        .eq("id", customerId);

    console.log(`✅ Subscription updated for customer ${customerId}`);
}

async function handleSubscriptionCancellation(
    subscription: any,
    supabase: any
) {
    const customerId = subscription.metadata?.customer_id;

    if (!customerId) return;

    await supabase
        .from("customers")
        .update({
            last_activity: new Date().toISOString(),
        })
        .eq("id", customerId);

    console.log(`⚠️ Subscription cancelled for customer ${customerId}`);
}

async function handleInvoicePayment(invoice: any, supabase: any) {
    const customerId = invoice.customer_metadata?.customer_id;
    const amount = invoice.amount_paid / 100;

    if (!customerId) return;

    console.log(`✅ Invoice paid for customer ${customerId}: $${amount}`);
}
