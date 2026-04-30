/**
 * Risk Matrix Component - Mock Data & Integration Guide
 * 
 * This file contains example mock data and integration instructions
 * for the RiskMatrix component.
 */

import { RiskMatrix } from "@/components/dashboard/RiskMatrix";

/**
 * Mock Risk Data for Testing/Development
 * Replace with real data from your database
 */
export const MOCK_RISKS = [
    {
        id: "risk-001",
        name: "Database Performance Degradation",
        description: "Query response times exceeding SLA thresholds",
        likelihood: 4,
        impact: 5,
        category: "technical" as const,
        status: "open" as const,
        mitigation: "Implement query optimization and database indexing strategy",
        owner: "Database Team",
        createdAt: new Date("2024-03-15"),
        updatedAt: new Date("2024-04-18"),
        trend: "increasing" as const,
    },
    {
        id: "risk-002",
        name: "API Rate Limiting Issues",
        description: "Third-party API rate limits affecting data pipeline",
        likelihood: 3,
        impact: 4,
        category: "technical" as const,
        status: "mitigating" as const,
        mitigation: "Implement request batching and caching layer",
        owner: "Backend Team",
        createdAt: new Date("2024-02-20"),
        updatedAt: new Date("2024-04-19"),
        trend: "decreasing" as const,
    },
    {
        id: "risk-003",
        name: "Customer Data Privacy Exposure",
        description: "Potential PII data exposure in logs or backups",
        likelihood: 2,
        impact: 5,
        category: "compliance" as const,
        status: "open" as const,
        mitigation: "Implement data masking and encryption protocols",
        owner: "Security Team",
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-04-10"),
        trend: "stable" as const,
    },
    {
        id: "risk-004",
        name: "ML Model Accuracy Drift",
        description: "Churn prediction model accuracy degrading over time",
        likelihood: 3,
        impact: 3,
        category: "technical" as const,
        status: "mitigating" as const,
        mitigation: "Implement monthly retraining pipeline with new data",
        owner: "ML Ops Team",
        createdAt: new Date("2024-03-01"),
        updatedAt: new Date("2024-04-18"),
        trend: "stable" as const,
    },
    {
        id: "risk-005",
        name: "Budget Overspend on Cloud Infrastructure",
        description: "Monthly cloud costs exceeding forecast by 30%",
        likelihood: 4,
        impact: 4,
        category: "financial" as const,
        status: "open" as const,
        mitigation: "Implement resource optimization and auto-scaling policies",
        owner: "DevOps Team",
        createdAt: new Date("2024-03-05"),
        updatedAt: new Date("2024-04-19"),
        trend: "increasing" as const,
    },
    {
        id: "risk-006",
        name: "Competitor Churn Tactics",
        description: "Competitors offering aggressive discounts affecting retention",
        likelihood: 4,
        impact: 4,
        category: "market" as const,
        status: "open" as const,
        mitigation: "Launch loyalty program and value-add features",
        owner: "Product Team",
        createdAt: new Date("2024-04-01"),
        updatedAt: new Date("2024-04-19"),
        trend: "increasing" as const,
    },
    {
        id: "risk-007",
        name: "Key Personnel Dependency",
        description: "Single point of failure for critical system knowledge",
        likelihood: 2,
        impact: 4,
        category: "operational" as const,
        status: "mitigating" as const,
        mitigation: "Cross-train team and document critical processes",
        owner: "HR/Engineering Lead",
        createdAt: new Date("2024-02-10"),
        updatedAt: new Date("2024-04-15"),
        trend: "decreasing" as const,
    },
    {
        id: "risk-008",
        name: "Regulatory Compliance Changes",
        description: "New data protection regulations requiring system changes",
        likelihood: 3,
        impact: 4,
        category: "compliance" as const,
        status: "open" as const,
        mitigation: "Conduct compliance audit and implement required controls",
        owner: "Legal/Compliance Team",
        createdAt: new Date("2024-03-20"),
        updatedAt: new Date("2024-04-18"),
        trend: "stable" as const,
    },
    {
        id: "risk-009",
        name: "AI Agent System Failure",
        description: "Complete outage of autonomous agent orchestration",
        likelihood: 1,
        impact: 5,
        category: "technical" as const,
        status: "open" as const,
        mitigation: "Implement redundancy and failover to manual processes",
        owner: "Platform Team",
        createdAt: new Date("2024-04-05"),
        updatedAt: new Date("2024-04-19"),
        trend: "stable" as const,
    },
    {
        id: "risk-010",
        name: "Customer Support Backlog",
        description: "Support ticket queue growing, affecting customer satisfaction",
        likelihood: 3,
        impact: 2,
        category: "operational" as const,
        status: "mitigating" as const,
        mitigation: "Hire additional support staff and implement AI chatbot",
        owner: "Support Team Lead",
        createdAt: new Date("2024-03-25"),
        updatedAt: new Date("2024-04-17"),
        trend: "decreasing" as const,
    },
];

/**
 * Example: Integration in Dashboard Page
 * 
 * Add to: src/app/(dashboard)/page.tsx
 */
export function RiskMatrixExample() {
    const handleRiskSelect = (risk: typeof MOCK_RISKS[0]) => {
        console.log("Risk selected:", risk);
        // Open risk detail modal or navigate to risk detail page
    };

    const handleMitigationUpdate = (riskId: string, mitigation: string) => {
        console.log("Mitigation updated for risk", riskId, ":", mitigation);
        // Call API to update risk mitigation plan
    };

    return (
        <RiskMatrix
            risks= { MOCK_RISKS }
    onRiskSelect = { handleRiskSelect }
    onMitigationUpdate = { handleMitigationUpdate }
        />
    );
}

/**
 * Actual Integration Code for (dashboard)/page.tsx
 * 
 * 1. Add import at top:
 * import { RiskMatrix } from "@/components/dashboard/RiskMatrix";
 * 
 * 2. Create a custom hook to fetch risks from database:
 * function useRisks() {
 *   const [risks, setRisks] = useState([]);
 *   const [isLoading, setIsLoading] = useState(true);
 *   
 *   useEffect(() => {
 *     // Fetch from Supabase
 *     const channel = supabase
 *       .channel('risks')
 *       .on('postgres_changes', { event: '*', schema: 'public', table: 'risk_alerts' }, (payload) => {
 *         setRisks(prev => [...prev, payload.new]);
 *       })
 *       .subscribe();
 *     
 *     return () => channel.unsubscribe();
 *   }, []);
 *   
 *   return { risks, isLoading };
 * }
 * 
 * 3. Add to dashboard page:
 * export default function DashboardPage() {
 *   const { risks } = useRisks();
 *   
 *   return (
 *     <div className="space-y-10">
 *       {/* ... other components ... */}
 *       
 * <RiskMatrix
 * risks={ risks }
 * onRiskSelect={
    (risk) => {
 *           // Handle risk selection - maybe open a modal or navigate
 *         }
}
 *       />
    * </div>
    *   );
 * }
 */

/**
 * Database Schema for Risk Management
 * 
 * CREATE TABLE risk_alerts (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name VARCHAR(255) NOT NULL,
 *   description TEXT,
 *   likelihood INTEGER NOT NULL CHECK (likelihood >= 1 AND likelihood <= 5),
 *   impact INTEGER NOT NULL CHECK (impact >= 1 AND impact <= 5),
 *   category VARCHAR(50) NOT NULL,
 *   status VARCHAR(50) NOT NULL,
 *   mitigation TEXT,
 *   owner VARCHAR(255),
 *   trend VARCHAR(50),
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 * 
 * CREATE INDEX idx_risk_alerts_category ON risk_alerts(category);
 * CREATE INDEX idx_risk_alerts_status ON risk_alerts(status);
 * CREATE INDEX idx_risk_alerts_likelihood_impact ON risk_alerts(likelihood, impact);
 */

/**
 * Hook for Fetching Risks from Supabase
 * 
 * import { useEffect, useState } from 'react';
 * import { supabase } from '@/lib/supabase';
 * 
 * export function useRisks() {
 *   const [risks, setRisks] = useState([]);
 *   const [isLoading, setIsLoading] = useState(true);
 *   const [error, setError] = useState<Error | null>(null);
 * 
 *   useEffect(() => {
 *     // Initial fetch
 *     const fetchRisks = async () => {
 *       try {
 *         setIsLoading(true);
 *         const { data, error } = await supabase
 *           .from('risk_alerts')
 *           .select('*')
 *           .order('created_at', { ascending: false });
 * 
 *         if (error) throw error;
 *          setRisks(data || []);
 *       } catch (err) {
 *         setError(err instanceof Error ? err : new Error('Unknown error'));
 *       } finally {
 *         setIsLoading(false);
 *       }
 *     };
 * 
 *     fetchRisks();
 * 
 *     // Real-time subscription
 *     const channel = supabase
 *       .channel('risks')
 *       .on(
 *         'postgres_changes',
 *         { event: '*', schema: 'public', table: 'risk_alerts' },
 *         (payload) => {
 *           if (payload.eventType === 'INSERT') {
 *             setRisks((prev) => [payload.new, ...prev]);
 *           } else if (payload.eventType === 'UPDATE') {
 *             setRisks((prev) =>
 *               prev.map((r) => (r.id === payload.new.id ? payload.new : r))
 *             );
 *           } else if (payload.eventType === 'DELETE') {
 *             setRisks((prev) => prev.filter((r) => r.id !== payload.old.id));
 *           }
 *         }
 *       )
 *       .subscribe();
 * 
 *     return () => {
 *       channel.unsubscribe();
 *     };
 *   }, []);
 * 
 *   return { risks, isLoading, error };
 * }
 */

/**
 * Features of RiskMatrix Component
 * 
 * ✅ 5x5 Grid Layout
 *    - Likelihood (1-5) on Y-axis
 *    - Impact (1-5) on X-axis
 *    - Severity color-coded (Red/Orange/Yellow/Green)
 * 
 * ✅ Risk Filtering
 *    - Filter by Category (Technical, Operational, Financial, Compliance, Market)
 *    - Filter by Status (Open, Mitigating, Resolved)
 *    - Live count updates
 * 
 * ✅ Risk Details Dialog
 *    - Click on matrix cell to view risks in that cell
 *    - Shows risk name, description, category, status
 *    - Displays mitigation plan and owner
 *    - Shows trend indicators (increasing/decreasing/stable)
 * 
 * ✅ Statistics
 *    - Critical risk count (severity 20-25)
 *    - High risk count (severity 12-19)
 *    - Total tracked risks
 * 
 * ✅ Responsive Design
 *    - Works on mobile, tablet, desktop
 *    - Horizontal scroll for matrix on smaller screens
 *    - Dark mode support
 * 
 * ⚠️ Not Yet Implemented (Future Enhancements)
 *    - Drag-and-drop risks between cells (requires react-beautiful-dnd)
 *    - Risk timeline/history tracking
 *    - Export matrix as image
 *    - Integration with alert notifications
 *    - Risk ownership assignment workflow
 */
