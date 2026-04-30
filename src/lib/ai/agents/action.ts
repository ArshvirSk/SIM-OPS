/**
 * Action Agent - LangChain + AI Engine
 * Executes actions and generates personalized messages
 */

import { actionExecutor } from "@/lib/actions/executor";
import { createClient } from "@/lib/supabase/client";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { flashModel, isLLMAvailable, usageTracker } from "../gemini-config";

const AGENT_ID = "action";

/**
 * Message Generation Prompts
 */
const slackMessagePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are writing urgent Slack alerts for customer success teams. Be concise (under 100 words), professional, and actionable.",
  ],
  [
    "human",
    `Write a Slack alert for:

Customer: {customer_name}
Email: {customer_email}
Churn Risk: {churn_risk}%
Severity: {severity}
Key Issues: {issues}

Include specific metrics and suggest immediate actions.`,
  ],
]);

const jiraDescriptionPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are writing detailed Jira tickets for account management. Use markdown formatting, be thorough, and include actionable steps.",
  ],
  [
    "human",
    `Write a Jira ticket description for:

Customer: {customer_name}
Risk Level: {severity}
Churn Probability: {churn_risk}%
Analysis: {analysis}

Include:
- **Situation Summary**: Current state
- **Risk Factors**: Specific concerns
- **Recommended Actions**: Prioritized steps
- **Success Criteria**: How to measure resolution
- **Timeline**: Urgency and deadlines`,
  ],
]);

/**
 * Incident Report Prompt — generates rich, actionable incident details
 */
const incidentReportPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert incident response specialist for SaaS operations.
Generate a comprehensive incident report that an on-call team can act on immediately.
Be specific, include concrete numbers and time-bound action items.
Write in plain text (no markdown headers — just clear numbered lists and paragraphs).`,
  ],
  [
    "human",
    `Generate a detailed incident report for this customer churn risk situation:

Customer: {customer_name} ({customer_email})
Churn Probability: {churn_risk}%
Severity: {severity}
Decision Reasoning: {reasoning}
Root Cause Analysis: {root_cause}
Recommended Solutions: {solutions}
Revenue Impact: {revenue_impact}

Provide TWO sections separated by "---RUNBOOK---":

SECTION 1 — INCIDENT DESCRIPTION (3-5 paragraphs):
- What happened: concrete behavioral signals detected
- Why it matters: revenue impact and business consequences
- Root cause analysis: primary and contributing factors
- Customer context: sentiment, engagement level, history pattern

SECTION 2 — ACTIONABLE RUNBOOK (after ---RUNBOOK--- marker):
Numbered steps (6-10 steps) with:
- Each step should have a TIME CONSTRAINT (e.g., "within 2 hours", "by end of day")
- Specific owner role (e.g., "CSM", "Account Executive", "VP Sales")
- Expected outcome of each step
- Escalation path if step fails

End with SUCCESS CRITERIA: 3-4 measurable outcomes that indicate the issue is resolved.`,
  ],
]);

/**
 * Generate rich incident details using LLM
 */
async function generateIncidentDetails(
  customerData: any,
  decision: any,
): Promise<{ description: string; runbook: string }> {
  if (!isLLMAvailable() || !usageTracker.checkAndIncrement(2000)) {
    return generateFallbackIncidentDetails(customerData, decision);
  }

  try {
    const chain = incidentReportPrompt.pipe(flashModel);
    const result = await chain.invoke({
      customer_name: customerData.name,
      customer_email: customerData.email,
      churn_risk: ((decision.churn_risk ?? 0) * 100).toFixed(0),
      severity: decision.severity?.toUpperCase() ?? "HIGH",
      reasoning: decision.reasoning || "Declining engagement detected",
      root_cause: JSON.stringify(decision.root_cause_analysis || { primary_cause: "Unknown" }),
      solutions: JSON.stringify(decision.recommended_solutions || []),
      revenue_impact: decision.estimated_revenue_impact || "Unknown",
    });

    const fullText = result.content.toString();
    const parts = fullText.split("---RUNBOOK---");
    return {
      description: parts[0]?.trim() || fullText.substring(0, 1000),
      runbook: parts[1]?.trim() || generateFallbackRunbook(customerData, decision),
    };
  } catch (err) {
    console.warn("  ⚠ LLM incident generation failed, using fallback:", err);
    return generateFallbackIncidentDetails(customerData, decision);
  }
}

function generateFallbackIncidentDetails(
  customer: any,
  decision: any,
): { description: string; runbook: string } {
  const churnPct = ((decision.churn_risk ?? 0) * 100).toFixed(0);
  const rca = decision.root_cause_analysis;
  const solutions = decision.recommended_solutions || [];

  let desc = `AI Agent detected ${churnPct}% churn probability for ${customer.name} (${customer.email}). `;
  desc += decision.reasoning || "Declining engagement detected.";
  if (rca?.primary_cause) {
    desc += `\n\nRoot Cause: ${rca.primary_cause}.`;
    if (rca.contributing_factors?.length) {
      desc += ` Contributing factors: ${rca.contributing_factors.join(", ")}.`;
    }
    if (rca.customer_sentiment) {
      desc += ` Customer sentiment: ${rca.customer_sentiment}.`;
    }
  }
  if (decision.estimated_revenue_impact) {
    desc += `\n\nEstimated Revenue Impact: ${decision.estimated_revenue_impact}.`;
  }
  if (solutions.length > 0) {
    desc += `\n\nRecommended Solutions:\n`;
    solutions.forEach((s: any, i: number) => {
      desc += `${i + 1}. [${(s.priority || "").toUpperCase()}] ${s.action}: ${s.description || ""} (effort: ${s.effort || "?"}, impact: ${s.expected_impact || "?"})\n`;
    });
  }

  return {
    description: desc,
    runbook: generateFallbackRunbook(customer, decision),
  };
}

function generateFallbackRunbook(customer: any, decision: any): string {
  if (decision.severity === "critical") {
    return `1. [Within 1h] CSM: Acknowledge incident and review customer profile for ${customer.name}
2. [Within 2h] Account Executive: Schedule emergency call with customer stakeholders
3. [Within 4h] VP Sales: Prepare custom retention offer (up to 30% discount)
4. [Within 24h] CSM: Present retention proposal on call
5. [Within 24h] Product: Review customer's feature requests and usage blockers
6. [Within 48h] CSM: Document all touchpoints and update CRM
7. [Within 72h] Team: Review outcome and adjust strategy if needed

SUCCESS CRITERIA:
- Customer responds to outreach within 48h
- Retention offer presented within 24h
- Churn probability drops below 60% within 14 days
- Customer re-engages with product (login within 7 days)`;
  }
  return `1. [Within 4h] CSM: Send personalized re-engagement email to ${customer.name}
2. [Within 24h] CSM: Offer 1-month extension or account credit
3. [Within 48h] Account Executive: Schedule product demo or success call
4. [Within 48h] Product: Identify usage drop-off reason from analytics
5. [Within 1 week] CSM: Follow up and assess engagement improvement
6. [Within 2 weeks] Team: Review if further escalation needed

SUCCESS CRITERIA:
- Customer opens re-engagement email within 48h
- Customer logs in within 7 days
- At least one call/meeting scheduled
- Churn risk drops below 60% within 21 days`;
}

/**
 * Run Action Agent with LangChain
 */
export async function runActionAgentLLM(decisionData: any, customerData: any) {
  console.log("⚡ Action Agent (LangChain + AI Engine): Executing actions...");

  const decision = decisionData.decision;

  if (!decision.should_act) {
    console.log("  → No action required");
    return { executed: false, reason: "Low risk - no action needed" };
  }

  try {
    let slackMessage = "";
    let jiraDescription = "";

    // Generate personalized messages with LLM if available
    if (isLLMAvailable() && usageTracker.checkAndIncrement(1500)) {
      console.log("  → Generating LLM-powered messages");

      // Generate Slack message
      const slackChain = slackMessagePrompt.pipe(flashModel);
      const slackResult = await slackChain.invoke({
        customer_name: customerData.name,
        customer_email: customerData.email,
        churn_risk: (decision.churn_risk * 100).toFixed(0),
        severity: decision.severity.toUpperCase(),
        issues: decision.reasoning || "Declining engagement detected",
      });
      slackMessage = slackResult.content.toString();

      // Generate Jira description if needed
      if (decision.actions.includes("jira")) {
        const jiraChain = jiraDescriptionPrompt.pipe(flashModel);
        const jiraResult = await jiraChain.invoke({
          customer_name: customerData.name,
          severity: decision.severity.toUpperCase(),
          churn_risk: (decision.churn_risk * 100).toFixed(0),
          analysis:
            decision.reasoning || "Customer showing signs of disengagement",
        });
        jiraDescription = jiraResult.content.toString();
      }

      console.log("  ✓ LLM messages generated");
    } else {
      // Fallback to template messages
      console.log("  → Using template messages");
      slackMessage = generateTemplateSlackMessage(customerData, decision);
      jiraDescription = generateTemplateJiraDescription(customerData, decision);
    }

    // Execute action
    await actionExecutor.execute({
      type: "churn_alert",
      severity: decision.severity,
      data: {
        customer_id: customerData.id,
        customer_name: customerData.name,
        customer_email: customerData.email,
        churn_probability: decision.churn_risk,
        risk_level: decision.severity,
        contributing_factors: decision.contributing_factors || [],
        recommended_actions: decision.actions || [],
        custom_message: slackMessage,
        custom_description: jiraDescription,
      },
    });

    // Store action log
    const supabase = createClient();
    await supabase.from("agent_decisions").insert({
      agent_id: AGENT_ID,
      input: `Execute actions for customer ${customerData.id}`,
      output: `Actions executed: ${decision.actions.join(", ")}`,
      reasoning: JSON.stringify({
        actions: decision.actions,
        severity: decision.severity,
        message_method: isLLMAvailable() ? "llm" : "template",
        method: isLLMAvailable() ? "llm" : "rule-based",
      }),
      confidence: 90.0,
      severity: decision.severity,
    });

    // ── Auto-create incident for critical/high severity with LLM-generated details ──
    if (decision.severity === "critical" || decision.severity === "high") {
      const incidentPriority = decision.severity === "critical" ? "P1" : "P2";

      try {
        console.log("  → Generating LLM-powered incident report...");
        const { description: incidentDescription, runbook: incidentRunbook } =
          await generateIncidentDetails(customerData, decision);

        await supabase.from("incidents").insert({
          title: `${incidentPriority} Churn Risk: Customer ${customerData.name}`,
          description: incidentDescription,
          severity: incidentPriority,
          status: "open",
          source: "agent",
          source_id: AGENT_ID,
          customer_id: customerData.id,
          runbook: incidentRunbook,
          tags: [
            "churn",
            decision.severity,
            isLLMAvailable() ? "ai-detected" : "rule-detected",
            ...(decision.root_cause_analysis?.contributing_factors || []).slice(0, 3),
          ],
        });
        console.log(
          `  ✓ ${incidentPriority} incident auto-created with detailed analysis for ${customerData.name}`,
        );
      } catch (incidentErr) {
        // Non-fatal: log but don't fail the action
        console.warn("  ⚠ Failed to create incident:", incidentErr);
      }
    }

    console.log(`  ✓ Actions executed: ${decision.actions.join(", ")}`);

    return {
      executed: true,
      actions: decision.actions,
      method: isLLMAvailable() ? "llm" : "template",
      slack_message: slackMessage,
      jira_description: jiraDescription,
    };
  } catch (error) {
    console.error("  ✗ Action execution failed:", error);

    const supabase = createClient();
    await supabase.from("agent_decisions").insert({
      agent_id: AGENT_ID,
      input: `Execute actions for customer ${customerData.id}`,
      output: "Action execution failed",
      reasoning: JSON.stringify({ error: String(error), method: "llm" }),
      confidence: 0,
      severity: decision.severity,
    });

    return {
      executed: false,
      error: String(error),
    };
  }
}

/**
 * Template message generators (fallback)
 */
function generateTemplateSlackMessage(customer: any, decision: any): string {
  const risk = (decision.churn_risk * 100).toFixed(0);
  return `🚨 **${decision.severity.toUpperCase()} ALERT**: Customer at Risk

**Customer:** ${customer.name} (${customer.email})
**Churn Risk:** ${risk}%
**Severity:** ${decision.severity.toUpperCase()}

**Issues Detected:**
${decision.reasoning || "Declining engagement and usage patterns"}

**Recommended Actions:**
- Review account activity immediately
- Schedule retention call within ${decision.urgency === "immediate" ? "24 hours" : "this week"}
- Consider offering proactive support or training

**Revenue at Risk:** $${customer.total_spend || "Unknown"}`;
}

function generateTemplateJiraDescription(customer: any, decision: any): string {
  const risk = (decision.churn_risk * 100).toFixed(0);
  return `## Customer Retention Alert

### Situation Summary
Customer **${customer.name}** (${customer.email}) is showing signs of potential churn with a **${risk}% risk probability**.

### Risk Factors
- Churn probability: ${risk}%
- Severity level: **${decision.severity.toUpperCase()}**
- ${decision.reasoning || "Declining engagement patterns detected"}

### Recommended Actions
1. **Immediate outreach** - Contact within ${decision.urgency === "immediate" ? "24 hours" : "this week"}
2. **Review account health** - Analyze usage patterns and engagement metrics
3. **Retention strategy** - Consider incentives, training, or dedicated support
4. **Escalate if needed** - Involve account executive for high-value customers

### Success Criteria
- [ ] Customer contacted and issues identified
- [ ] Retention plan created and shared with team
- [ ] Follow-up scheduled within 7 days
- [ ] Churn risk reduced to <60%

### Timeline
**Urgency:** ${decision.urgency.replace("_", " ")}
**Due Date:** ${decision.urgency === "immediate" ? "Next 24 hours" : "End of week"}

### Additional Context
- Total spend: $${customer.total_spend || 0}
- Support tickets: ${customer.support_tickets || 0}
- Last login: ${customer.last_login ? new Date(customer.last_login).toLocaleDateString() : "Unknown"}`;
}
