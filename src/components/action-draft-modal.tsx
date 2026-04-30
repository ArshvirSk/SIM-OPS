"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, Mail, Phone, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ActionDraftModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    action: string;
    customerData: {
        name?: string;
        email?: string;
        company?: string;
        churnRisk?: number;
        clv?: number;
        contributingFactors?: Array<{ factor: string; importance: number }>;
        lastActivity?: string;
        accountAge?: number;
    };
}

export function ActionDraftModal({
    open,
    onOpenChange,
    action,
    customerData,
}: ActionDraftModalProps) {
    const [copied, setCopied] = useState(false);
    const [isEditable, setIsEditable] = useState(false);
    const [editedContent, setEditedContent] = useState("");

    // Determine action type
    const actionLower = action.toLowerCase();
    const isEmail = actionLower.includes("email") || actionLower.includes("campaign");
    const isCall = actionLower.includes("call") || actionLower.includes("check-in") || actionLower.includes("schedule");
    const isDiscount = actionLower.includes("discount") || actionLower.includes("offer") || actionLower.includes("loyalty");
    const isResource = actionLower.includes("resource") || actionLower.includes("guide") || actionLower.includes("tip");

    // Generate content based on action type
    const generateContent = () => {
        const customerName = customerData.name || "Valued Customer";
        const company = customerData.company || "your organization";
        const churnRisk = customerData.churnRisk ? (customerData.churnRisk * 100).toFixed(0) : "high";
        const topFactor = customerData.contributingFactors?.[0];
        const factorName = topFactor?.factor.replace(/_/g, " ") || "engagement";
        const daysInactive = customerData.lastActivity 
            ? Math.floor((Date.now() - new Date(customerData.lastActivity).getTime()) / (1000 * 60 * 60 * 24))
            : 30;

        if (isEmail || isDiscount) {
            const subject = isDiscount 
                ? `Exclusive Offer: Special Discount for ${company}`
                : `Let's Reconnect - We're Here to Help`;

            const body = isDiscount
                ? `Hi ${customerName},

As one of our valued customers, we wanted to reach out with a special offer designed just for you.

EXCLUSIVE OFFER: 20% OFF YOUR NEXT 3 MONTHS

We've noticed some changes in your ${factorName}, and we want to make sure you're getting the most value from our platform. This exclusive discount is our way of showing appreciation for your partnership.

Why This Matters:
• Save $${((customerData.clv || 50000) * 0.2 / 12).toFixed(0)}/month for the next 3 months
• Full access to all premium features
• Dedicated support to help you maximize value
• Valid for 30 days

How to Redeem:
Simply reply to this email or click the link below to apply this discount to your account automatically.

[REDEEM DISCOUNT - Code: RETAIN20]

We're committed to your success and want to ensure ${company} continues to thrive with our platform.

Questions? I'm here to help - just reply to this email or schedule a quick call.

Best regards,
Customer Success Team

P.S. This offer expires in 30 days, so don't miss out!`
                : `Hi ${customerName},

I hope this email finds you well. I'm reaching out because I noticed some changes in your account activity, and I wanted to personally check in.

What I've Observed:
• Your ${factorName} has decreased over the past ${daysInactive} days
• We want to ensure you're getting maximum value from our platform
• There may be features or resources that could better support ${company}

How We Can Help:
I'd love to schedule a brief 15-minute call to:
• Understand any challenges you're facing
• Share some tips tailored to your specific use case
• Explore features that could drive more value for your team

Your Success Matters:
With a customer lifetime value of $${((customerData.clv || 50000) / 1000).toFixed(1)}K, you're an important partner to us. We're committed to ensuring ${company} gets the most out of our platform.

Would you be available for a quick call this week? Here's my calendar link: [CALENDAR LINK]

Alternatively, I'm happy to answer any questions via email.

Looking forward to connecting,
[Your Name]
Customer Success Manager

P.S. I've also attached a quick guide on [relevant feature] that might be helpful.`;

            return {
                type: "email",
                subject,
                body,
            };
        }

        if (isCall) {
            return {
                type: "call",
                content: `CALL PREPARATION GUIDE

CUSTOMER: ${customerName} (${company})
OBJECTIVE: Re-engage customer and address ${factorName} concerns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT SITUATION:
• Churn Risk: ${churnRisk}%
• Account Value: $${((customerData.clv || 50000) / 1000).toFixed(1)}K
• Days Since Last Activity: ${daysInactive}
• Primary Concern: ${factorName}
${topFactor ? `• Impact Level: ${(topFactor.importance * 100).toFixed(0)}% of churn risk` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TALKING POINTS:

1. Opening (Warm & Personal)
   "Hi ${customerName}, thanks for taking the time to chat. I wanted to reach out personally because I noticed some changes in how ${company} has been using our platform."

2. Acknowledge the Situation
   "I see your ${factorName} has decreased recently. I want to understand what's happening and how we can better support you."

3. Ask Discovery Questions
   • "What challenges are you currently facing with the platform?"
   • "Has anything changed in your workflow or team structure?"
   • "Are there specific features you wish worked differently?"
   • "What would make our platform more valuable for ${company}?"

4. Present Solutions
   • Offer personalized onboarding/training session
   • Highlight underutilized features relevant to their use case
   • Share success stories from similar customers
   • Discuss new features launching soon

5. Address Value
   "I want to make sure you're getting the full value from your investment. Let's work together to turn this around."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJECTION HANDLING:

"It's too expensive"
→ "I understand budget is important. Let's look at the ROI you're getting and explore ways to maximize value. I can also discuss flexible options."

"We're not using it enough"
→ "That's exactly why I'm calling. Let's identify what's blocking adoption and create a plan to change that. Many customers felt the same way before we helped them unlock the platform's potential."

"We're considering alternatives"
→ "I appreciate your honesty. Before you make that decision, let me show you what you might be missing. Can we schedule a 30-minute session to explore this?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS TO PROPOSE:

✓ Schedule follow-up training session (specific date/time)
✓ Send personalized resource guide within 24 hours
✓ Set up weekly check-in for next month
✓ Introduce them to dedicated support contact
✓ Offer trial of premium features (if applicable)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLOSING:
"${customerName}, I'm committed to making this work for ${company}. Let's schedule our next touchpoint right now - does [DATE] work for you?"

POST-CALL:
• Send summary email within 1 hour
• Create follow-up tasks in CRM
• Update customer notes with key insights
• Set reminder for next check-in`,
            };
        }

        if (isResource) {
            return {
                type: "email",
                subject: `Helpful Resources for ${company}`,
                body: `Hi ${customerName},

I wanted to share some resources that could help ${company} get more value from our platform, especially regarding ${factorName}.

RECOMMENDED RESOURCES:

1. Quick Start Guide: Maximizing ${factorName.charAt(0).toUpperCase() + factorName.slice(1)}
   A 5-minute guide to boost your results
   [LINK TO GUIDE]

2. Video Tutorial: Best Practices
   Watch how top customers use this feature
   [LINK TO VIDEO]

3. Case Study: Similar Success Story
   See how [Company X] increased engagement by 45%
   [LINK TO CASE STUDY]

4. Webinar Recording: Advanced Tips
   Deep dive into advanced features
   [LINK TO WEBINAR]

PERSONALIZED RECOMMENDATIONS:

Based on your current usage patterns, I recommend:
• Starting with Resource #1 (takes 5 minutes)
• Implementing the tips from the video tutorial
• Scheduling a 15-minute call if you have questions

NEED MORE HELP?

I'm here to support you. Feel free to:
• Reply to this email with questions
• Schedule a 1-on-1 session: [CALENDAR LINK]
• Join our weekly office hours: Thursdays at 2 PM

These resources have helped customers reduce churn risk by an average of 25%. I'm confident they'll be valuable for ${company} too.

Best regards,
[Your Name]
Customer Success Team`,
            };
        }

        // Default general outreach
        return {
            type: "email",
            subject: `Important: Let's Discuss Your Account`,
            body: `Hi ${customerName},

I wanted to reach out regarding your account with us. We've noticed some changes that we'd like to discuss.

Current Situation:
• ${factorName.charAt(0).toUpperCase() + factorName.slice(1)} needs attention
• Account value: $${((customerData.clv || 50000) / 1000).toFixed(1)}K
• Last activity: ${daysInactive} days ago

Let's Connect:
I'd like to schedule a brief call to understand how we can better support ${company}. 

Available this week? Here's my calendar: [CALENDAR LINK]

Best regards,
[Your Name]`,
        };
    };

    const content = generateContent();

    const handleCopy = () => {
        const textToCopy = content.type === "email"
            ? `Subject: ${content.subject}\n\n${content.body}`
            : content.content;

        navigator.clipboard.writeText(isEditable ? editedContent : textToCopy || "");
        setCopied(true);
        toast.success("Content copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEdit = () => {
        if (!isEditable) {
            const textToEdit = content.type === "email"
                ? `Subject: ${content.subject}\n\n${content.body}`
                : content.content;
            setEditedContent(textToEdit || "");
        }
        setIsEditable(!isEditable);
    };

    const getIcon = () => {
        if (isCall) return <Phone className="h-5 w-5" />;
        if (isEmail || isDiscount || isResource) return <Mail className="h-5 w-5" />;
        return <FileText className="h-5 w-5" />;
    };

    const getTitle = () => {
        if (isCall) return "Call Talking Points";
        if (isDiscount) return "Discount Offer Email Draft";
        if (isResource) return "Resource Email Draft";
        if (isEmail) return "Email Draft";
        return "Action Content";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-5xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {getIcon()}
                        {getTitle()}
                    </DialogTitle>
                    <DialogDescription>
                        Copy this content and use it for your outreach. You can edit it before copying.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {content.type === "email" && !isEditable && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">
                                    Subject Line:
                                </label>
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="font-medium">{content.subject}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-muted-foreground">
                                    Email Body:
                                </label>
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                        {content.body}
                                    </pre>
                                </div>
                            </div>
                        </>
                    )}

                    {content.type === "call" && !isEditable && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                                {content.content}
                            </pre>
                        </div>
                    )}

                    {isEditable && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground">
                                Edit Content:
                            </label>
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-4 border-t">
                        <Button
                            onClick={handleCopy}
                            className="flex-1"
                            disabled={copied}
                        >
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy to Clipboard
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={handleEdit}
                            variant="outline"
                        >
                            {isEditable ? "Preview" : "Edit"}
                        </Button>
                        <Button
                            onClick={() => onOpenChange(false)}
                            variant="outline"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
