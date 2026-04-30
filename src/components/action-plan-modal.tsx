"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Clock, Copy, FileText, Mail, Phone, Target, TrendingUp, Users, X, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ActionPlanModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    action: string;
    actionIndex: number;
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
    onGetDraft?: () => void;
}

export function ActionPlanModal({
    open,
    onOpenChange,
    action,
    actionIndex,
    customerData,
    onGetDraft,
}: ActionPlanModalProps) {
    const [draftGenerated, setDraftGenerated] = useState(false);
    const [showDraftPanel, setShowDraftPanel] = useState(false);
    const [copied, setCopied] = useState(false);
    const isHighPriority = actionIndex === 0;
    const isMediumPriority = actionIndex === 1;

    const priority = isHighPriority ? "High" : isMediumPriority ? "Medium" : "Low";
    const timeline = isHighPriority ? "7 days" : isMediumPriority ? "14 days" : "30 days";
    const retentionImpact = isHighPriority ? "15-20%" : isMediumPriority ? "8-12%" : "3-7%";
    const effort = isHighPriority ? "Medium" : isMediumPriority ? "Low" : "Low";

    // Generate action title
    const actionTitle = (action || "Action Plan").split('.')[0].substring(0, 80);

    // Determine action type and generate specific plan
    const actionLower = (action || "").toLowerCase();
    const isEmail = actionLower.includes("email") || actionLower.includes("campaign");
    const isCall = actionLower.includes("call") || actionLower.includes("check-in") || actionLower.includes("schedule");
    const isDiscount = actionLower.includes("discount") || actionLower.includes("offer") || actionLower.includes("loyalty");
    const isResource = actionLower.includes("resource") || actionLower.includes("guide") || actionLower.includes("tip");
    const isTicket = actionLower.includes("ticket") || actionLower.includes("support") || actionLower.includes("consultation");

    const topFactor = customerData.contributingFactors?.[0];
    const factorName = topFactor?.factor.replace(/_/g, " ") || "engagement";
    
    // Generate draft content
    const generateDraftContent = () => {
        const customerName = customerData.name || "Valued Customer";
        const company = customerData.company || "your organization";
        const daysInactive = customerData.accountAge || 30;
        
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

            return { type: "email", subject, body };
        }

        if (isCall) {
            return {
                type: "call",
                content: `CALL PREPARATION GUIDE

CUSTOMER: ${customerName} (${company})
OBJECTIVE: Re-engage customer and address ${factorName} concerns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT SITUATION:
• Churn Risk: ${((customerData.churnRisk || 0) * 100).toFixed(0)}%
• Account Value: $${((customerData.clv || 50000) / 1000).toFixed(1)}K
• Days Since Last Activity: ${daysInactive}
• Primary Concern: ${factorName}

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

NEXT STEPS TO PROPOSE:

✓ Schedule follow-up training session (specific date/time)
✓ Send personalized resource guide within 24 hours
✓ Set up weekly check-in for next month

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLOSING:
"${customerName}, I'm committed to making this work for ${company}. Let's schedule our next touchpoint right now - does [DATE] work for you?"`,
            };
        }

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
    
    const draftContent = generateDraftContent();
    
    const handleCopyDraft = () => {
        const textToCopy = draftContent.type === "email"
            ? `Subject: ${draftContent.subject}\n\n${draftContent.body}`
            : draftContent.content;

        navigator.clipboard.writeText(textToCopy || "");
        setCopied(true);
        toast.success("Content copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    // Generate timeline steps based on specific action content
    const generateTimeline = () => {
        // Extract key information from action text
        const actionText = action.toLowerCase();
        const hasTimeframe = actionText.match(/(\d+)\s*(day|week|month)/i);
        const timeframe = hasTimeframe ? hasTimeframe[0] : null;
        
        // Determine specific action details
        const isProactive = actionText.includes("proactively") || actionText.includes("reach out");
        const isTargeted = actionText.includes("targeted") || actionText.includes("campaign");
        const isPersonalized = actionText.includes("personalized") || actionText.includes("customized");
        const hasDiscount = actionText.includes("discount") || actionText.includes("offer") || actionText.includes("loyalty");
        const hasFeatures = actionText.includes("feature") || actionText.includes("product update");
        const hasResources = actionText.includes("resource") || actionText.includes("guide") || actionText.includes("tip");
        const hasConsultation = actionText.includes("consultation") || actionText.includes("brief") || actionText.includes("session");
        const hasTicketReview = actionText.includes("ticket") || actionText.includes("support") || actionText.includes("issue");
        const hasCheckIn = actionText.includes("check-in") || actionText.includes("follow-up");
        
        // Email-based actions
        if (isEmail || isDiscount || isTargeted) {
            const steps = [
                { 
                    day: "Day 1", 
                    task: `Generate ${isPersonalized ? 'personalized' : 'targeted'} email draft${hasDiscount ? ' with discount offer' : ''}`, 
                    owner: "AI System", 
                    duration: "Instant",
                    isDraftStep: true 
                },
            ];
            
            if (hasFeatures) {
                steps.push({ day: "Day 1", task: "Identify relevant features based on customer usage", owner: "CS Manager", duration: "20 mins", isDraftStep: false });
            }
            
            if (hasDiscount) {
                steps.push({ day: "Day 1", task: "Calculate and approve discount amount", owner: "Team Lead", duration: "30 mins", isDraftStep: false });
                steps.push({ day: "Day 1", task: "Generate unique discount code", owner: "System", duration: "Instant", isDraftStep: false });
            }
            
            steps.push({ day: "Day 1-2", task: "Review and customize email content", owner: "CS Manager", duration: "15 mins", isDraftStep: false });
            steps.push({ day: "Day 2", task: "Send email to customer", owner: "CS Manager", duration: "Instant", isDraftStep: false });
            
            if (isTargeted) {
                steps.push({ day: "Day 3-7", task: "Monitor email engagement metrics", owner: "CS Manager", duration: "Ongoing", isDraftStep: false });
            } else {
                steps.push({ day: "Day 3-5", task: "Track email open and response", owner: "CS Manager", duration: "Ongoing", isDraftStep: false });
            }
            
            const followUpDay = timeframe?.includes("week") ? "Day 7" : "Day 5";
            steps.push({ day: followUpDay, task: "Follow-up if no response", owner: "CS Manager", duration: "20 mins", isDraftStep: false });
            
            const evaluateDay = timeframe?.includes("week") ? "Day 14" : "Day 7";
            steps.push({ day: evaluateDay, task: "Evaluate engagement and adjust strategy", owner: "CS Team", duration: "30 mins", isDraftStep: false });
            
            return steps;
        }
        
        // Call/Check-in based actions
        if (isCall || hasCheckIn || hasConsultation) {
            const steps = [
                { 
                    day: "Day 1", 
                    task: `Generate ${hasConsultation ? 'consultation' : 'call'} talking points and agenda`, 
                    owner: "AI System", 
                    duration: "Instant",
                    isDraftStep: true 
                },
            ];
            
            if (isPersonalized) {
                steps.push({ day: "Day 1", task: "Research customer history and pain points", owner: "CS Manager", duration: "30 mins", isDraftStep: false });
            }
            
            steps.push({ day: "Day 1-2", task: "Schedule call with customer", owner: "CS Manager", duration: "15 mins", isDraftStep: false });
            
            const callDuration = hasConsultation ? "45 mins" : "30 mins";
            steps.push({ day: "Day 3-5", task: `Conduct ${hasConsultation ? 'consultation' : 'discovery'} call`, owner: "CS Manager", duration: callDuration, isDraftStep: false });
            
            steps.push({ day: "Day 5", task: "Send call summary and action items", owner: "CS Manager", duration: "20 mins", isDraftStep: false });
            
            if (hasFeatures) {
                steps.push({ day: "Day 6-7", task: "Provide feature demo or training", owner: "CS Team", duration: "45 mins", isDraftStep: false });
            }
            
            steps.push({ day: "Day 7-10", task: "Implement agreed-upon solutions", owner: "CS Team", duration: "Varies", isDraftStep: false });
            
            const followUpDay = timeframe?.includes("month") ? "Day 30" : "Day 14";
            steps.push({ day: followUpDay, task: "Follow-up check-in call", owner: "CS Manager", duration: "15 mins", isDraftStep: false });
            
            return steps;
        }
        
        // Support ticket/issue resolution actions
        if (hasTicketReview || hasConsultation) {
            const steps = [
                { day: "Day 1", task: "Review complete support ticket history", owner: "Support Team", duration: "30 mins", isDraftStep: false },
                { day: "Day 1", task: "Identify recurring issues and root causes", owner: "Support Lead", duration: "25 mins", isDraftStep: false },
                { 
                    day: "Day 2", 
                    task: "Generate consultation preparation guide", 
                    owner: "AI System", 
                    duration: "Instant",
                    isDraftStep: true 
                },
                { day: "Day 2", task: "Prepare solutions and workarounds", owner: "Support Team", duration: "40 mins", isDraftStep: false },
                { day: "Day 3-5", task: "Conduct consultation session with customer", owner: "CS Manager + Support", duration: "45 mins", isDraftStep: false },
                { day: "Day 5-7", task: "Implement solutions and provide resources", owner: "Support Team", duration: "Varies", isDraftStep: false },
                { day: "Day 10", task: "Check resolution effectiveness", owner: "CS Manager", duration: "20 mins", isDraftStep: false },
                { day: "Day 14", task: "Final follow-up and satisfaction check", owner: "CS Manager", duration: "15 mins", isDraftStep: false },
            ];
            
            return steps;
        }
        
        // Resource/Guide sharing actions
        if (hasResources) {
            const steps = [
                { 
                    day: "Day 1", 
                    task: "Generate personalized resource email", 
                    owner: "AI System", 
                    duration: "Instant",
                    isDraftStep: true 
                },
                { day: "Day 1", task: "Curate relevant guides and tutorials", owner: "CS Manager", duration: "25 mins", isDraftStep: false },
                { day: "Day 2", task: "Send resource package to customer", owner: "CS Manager", duration: "10 mins", isDraftStep: false },
                { day: "Day 3-7", task: "Monitor resource engagement", owner: "CS Manager", duration: "Ongoing", isDraftStep: false },
                { day: "Day 7", task: "Offer walkthrough session if needed", owner: "CS Manager", duration: "30 mins", isDraftStep: false },
                { day: "Day 14", task: "Follow-up on implementation", owner: "CS Manager", duration: "20 mins", isDraftStep: false },
            ];
            
            return steps;
        }
        
        // Default/Generic action plan
        const steps = [
            { day: "Day 1", task: "Analyze customer situation and specific needs", owner: "CS Manager", duration: "30 mins" },
            { 
                day: "Day 2", 
                task: "Generate personalized outreach content", 
                owner: "AI System", 
                duration: "Instant",
                isDraftStep: true 
            },
        ];
        
        if (isProactive) {
            steps.push({ day: "Day 2", task: "Prepare value proposition and benefits", owner: "CS Manager", duration: "20 mins", isDraftStep: false });
        }
        
        steps.push({ day: "Day 3", task: "Reach out to customer via preferred channel", owner: "CS Manager", duration: "20 mins", isDraftStep: false });
        steps.push({ day: "Day 5-7", task: "Implement initial interventions", owner: "CS Team", duration: "Varies", isDraftStep: false });
        steps.push({ day: "Day 10", task: "Monitor progress and engagement metrics", owner: "CS Manager", duration: "Ongoing", isDraftStep: false });
        
        const finalDay = timeframe?.includes("month") ? "Day 30" : "Day 14";
        steps.push({ day: finalDay, task: "Evaluate results and adjust strategy", owner: "CS Team", duration: "30 mins", isDraftStep: false });
        
        return steps;
    };

    const timelineSteps = generateTimeline();

    // Generate success metrics
    const successMetrics = [
        { metric: "Email Open Rate", target: isEmail ? "45%+" : "N/A", current: "N/A" },
        { metric: "Response Rate", target: "30%+", current: "N/A" },
        { metric: "Engagement Increase", target: retentionImpact, current: "Baseline" },
        { metric: "Churn Risk Reduction", target: `${(parseFloat(retentionImpact?.split('-')[0] || "10") * 0.6).toFixed(0)}%+`, current: `${((customerData.churnRisk || 0) * 100).toFixed(0)}%` },
    ];

    // Generate resources needed
    const resources = [
        { name: "Customer Success Manager", time: "2-3 hours/week", role: "Primary owner" },
        { name: "Email Templates", time: "Ready to use", role: "Communication" },
        { name: "CRM System", time: "Ongoing", role: "Tracking & monitoring" },
        isDiscount && { name: "Discount Authorization", time: "1-2 days", role: "Approval process" },
    ].filter(Boolean);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`min-w-4xl max-h-[85vh] overflow-y-auto transition-all duration-300 ${showDraftPanel ? 'mr-[500px]' : ''}`}>
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <DialogTitle className="text-xl mb-2">{actionTitle}</DialogTitle>
                            <DialogDescription className="text-sm">
                                Comprehensive execution plan for customer retention
                            </DialogDescription>
                        </div>
                        <Badge
                            variant={isHighPriority ? "destructive" : "secondary"}
                            className="shrink-0"
                        >
                            {priority} Priority
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Overview Cards */}
                    <div className="grid grid-cols-4 gap-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-xs font-semibold text-blue-900">Timeline</span>
                            </div>
                            <p className="text-lg font-bold text-blue-600">{timeline}</p>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-xs font-semibold text-green-900">Impact</span>
                            </div>
                            <p className="text-lg font-bold text-green-600">+{retentionImpact}</p>
                        </div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="h-4 w-4 text-purple-600" />
                                <span className="text-xs font-semibold text-purple-900">Effort</span>
                            </div>
                            <p className="text-lg font-bold text-purple-600">{effort}</p>
                        </div>
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <Target className="h-4 w-4 text-orange-600" />
                                <span className="text-xs font-semibold text-orange-900">Focus</span>
                            </div>
                            <p className="text-sm font-bold text-orange-600 capitalize">{factorName}</p>
                        </div>
                    </div>

                    {/* Action Description */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Action Description
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{action}</p>
                    </div>

                    {/* Execution Timeline */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Execution Timeline
                        </h3>
                        <div className="space-y-2">
                            {timelineSteps.map((step, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                                        step.isDraftStep 
                                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 hover:border-blue-400' 
                                            : 'bg-white border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-xs shrink-0 ${
                                        step.isDraftStep 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        {step.isDraftStep ? <FileText className="h-4 w-4" /> : idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-blue-600">{step.day}</span>
                                            <span className="text-xs text-muted-foreground">• {step.duration}</span>
                                        </div>
                                        <p className={`text-sm ${step.isDraftStep ? 'font-semibold' : 'font-medium'}`}>
                                            {step.task}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">Owner: {step.owner}</p>
                                    </div>
                                    {step.isDraftStep ? (
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setDraftGenerated(true);
                                                setShowDraftPanel(true);
                                            }}
                                            disabled={draftGenerated}
                                            variant={draftGenerated ? "secondary" : "default"}
                                            className="shrink-0"
                                        >
                                            {draftGenerated ? (
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    View Draft
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <FileText className="h-4 w-4" />
                                                    Get Draft
                                                </span>
                                            )}
                                        </Button>
                                    ) : (
                                        <CheckCircle2 className="h-5 w-5 text-gray-300 shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Success Metrics */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Success Metrics
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {successMetrics.map((metric, idx) => (
                                <div key={idx} className="p-3 bg-white border border-gray-200 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">{metric.metric}</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-bold text-green-600">{metric.target}</span>
                                        <span className="text-xs text-muted-foreground">target</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Current: {metric.current}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resources Needed */}
                    <div>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Resources Needed
                        </h3>
                        <div className="space-y-2">
                            {resources.map((resource: any, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium">{resource.name}</p>
                                        <p className="text-xs text-muted-foreground">{resource.role}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {resource.time}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Expected Outcome */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                        <h3 className="font-semibold text-sm mb-2 text-green-900">Expected Outcome</h3>
                        <p className="text-sm text-green-800 leading-relaxed">
                            By executing this action plan, we expect to reduce churn risk by <span className="font-bold">{retentionImpact}</span> within <span className="font-bold">{timeline}</span>.
                            This will address the primary concern of <span className="font-bold">{factorName}</span> and improve overall customer engagement.
                            The estimated revenue impact is <span className="font-bold">${((customerData.clv || 50000) * (parseFloat(retentionImpact?.split('-')[0] || "10") / 100) / 1000).toFixed(1)}K</span> in retained value.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-4 border-t">
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Got It
                        </Button>
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(`Action Plan: ${actionTitle}\n\nTimeline: ${timeline}\nImpact: +${retentionImpact}\n\n${timelineSteps.map((s, i) => `${i + 1}. ${s.day}: ${s.task} (${s.owner})`).join('\n')}`);
                            }}
                            variant="outline"
                        >
                            Copy Plan
                        </Button>
                    </div>
                </div>

                {/* Sliding Draft Panel */}
                {showDraftPanel && (
                    <div className="fixed top-0 right-0 h-full w-[480px] bg-white border-l border-gray-300 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Panel Header */}
                        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center gap-2">
                                {draftContent.type === "email" ? (
                                    <Mail className="h-5 w-5 text-blue-600" />
                                ) : (
                                    <Phone className="h-5 w-5 text-blue-600" />
                                )}
                                <h3 className="font-semibold text-lg">
                                    {draftContent.type === "email" ? "Email Draft" : "Call Guide"}
                                </h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDraftPanel(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Panel Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {draftContent.type === "email" ? (
                                <>
                                    {/* Email Subject */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                                            Subject Line
                                        </label>
                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                            <p className="text-sm font-medium">{draftContent.subject}</p>
                                        </div>
                                    </div>

                                    {/* Email Body */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                                            Email Body
                                        </label>
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-gray-800">
                                                {draftContent.body}
                                            </pre>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Call Guide */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                                            Call Preparation Guide
                                        </label>
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                            <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-gray-800">
                                                {draftContent.content}
                                            </pre>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Usage Tips */}
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs font-semibold text-blue-900 mb-1">💡 Usage Tips</p>
                                <ul className="text-xs text-blue-800 space-y-1">
                                    <li>• Personalize the content based on your relationship with the customer</li>
                                    <li>• Review and adjust tone to match your communication style</li>
                                    <li>• Add specific details about recent interactions if available</li>
                                    {draftContent.type === "email" && (
                                        <li>• Test the email subject line for clarity and impact</li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* Panel Footer */}
                        <div className="p-4 border-t bg-gray-50 space-y-2">
                            <Button
                                onClick={handleCopyDraft}
                                className="w-full"
                                variant={copied ? "secondary" : "default"}
                            >
                                {copied ? (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Copied!
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Copy className="h-4 w-4" />
                                        Copy to Clipboard
                                    </span>
                                )}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">
                                {draftContent.type === "email" 
                                    ? "Copy and paste into your email client"
                                    : "Use this guide during your call"}
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
