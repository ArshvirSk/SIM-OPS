"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Eye } from "lucide-react";
import { useState } from "react";

/**
 * Risk item structure representing an identified risk
 */
interface RiskItem {
    id: string;
    name: string;
    description?: string;
    likelihood: number; // 1-5
    impact: number; // 1-5
    category: "technical" | "operational" | "financial" | "compliance" | "market";
    status: "open" | "mitigating" | "resolved";
    mitigation?: string;
    owner?: string;
    createdAt: Date;
    updatedAt: Date;
    trend?: "increasing" | "decreasing" | "stable"; // Risk trend
}

interface RiskMatrixProps {
    risks: RiskItem[];
    onRiskSelect?: (risk: RiskItem) => void;
    onMitigationUpdate?: (riskId: string, mitigation: string) => void;
}

/**
 * Calculate risk severity (1-25 scale)
 * Higher = more severe
 */
function calculateSeverity(likelihood: number, impact: number): number {
    return likelihood * impact;
}

/**
 * Get color for severity level
 */
function getSeverityColor(severity: number): string {
    if (severity >= 20) return "bg-red-500"; // Critical
    if (severity >= 12) return "bg-orange-500"; // High
    if (severity >= 6) return "bg-yellow-500"; // Medium
    return "bg-green-500"; // Low
}

/**
 * Get text color for severity level (for contrast)
 */
function getSeverityTextColor(severity: number): string {
    if (severity >= 12) return "text-white";
    return "text-slate-900 dark:text-white";
}

/**
 * Get severity label
 */
function getSeverityLabel(severity: number): string {
    if (severity >= 20) return "CRITICAL";
    if (severity >= 12) return "HIGH";
    if (severity >= 6) return "MEDIUM";
    return "LOW";
}

/**
 * Get category badge color
 */
function getCategoryColor(
    category: RiskItem["category"]
): "default" | "secondary" | "destructive" | "outline" {
    switch (category) {
        case "technical":
            return "secondary";
        case "operational":
            return "default";
        case "financial":
            return "destructive";
        case "compliance":
            return "outline";
        case "market":
            return "secondary";
        default:
            return "default";
    }
}

/**
 * RiskMatrix Component
 * Displays a 5x5 matrix visualization of risk likelihood vs impact
 * Allows users to visualize, filter, and manage identified risks
 */
export function RiskMatrix({
    risks,
    onRiskSelect,
    onMitigationUpdate,
}: RiskMatrixProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);

    // Filter risks based on selected category and status
    const filteredRisks = risks.filter((risk) => {
        const categoryMatch = selectedCategory === "all" || risk.category === selectedCategory;
        const statusMatch = selectedStatus === "all" || risk.status === selectedStatus;
        return categoryMatch && statusMatch;
    });

    // Build matrix grid with risk counts
    const matrixGrid: Record<string, RiskItem[]> = {};
    for (let likelihood = 1; likelihood <= 5; likelihood++) {
        for (let impact = 1; impact <= 5; impact++) {
            const key = `${likelihood}-${impact}`;
            matrixGrid[key] = filteredRisks.filter(
                (risk) => risk.likelihood === likelihood && risk.impact === impact
            );
        }
    }

    // Calculate statistics
    const criticalCount = filteredRisks.filter(
        (risk) => calculateSeverity(risk.likelihood, risk.impact) >= 20
    ).length;
    const highCount = filteredRisks.filter(
        (risk) => {
            const severity = calculateSeverity(risk.likelihood, risk.impact);
            return severity >= 12 && severity < 20;
        }
    ).length;
    const totalRisks = filteredRisks.length;

    return (
        <Card className="col-span-full">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Risk Matrix
                        </CardTitle>
                        <CardDescription>
                            Likelihood vs Impact analysis ({totalRisks} risks displayed)
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="operational">Operational</SelectItem>
                                <SelectItem value="financial">Financial</SelectItem>
                                <SelectItem value="compliance">Compliance</SelectItem>
                                <SelectItem value="market">Market</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="mitigating">Mitigating</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Statistics Row */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                        <p className="text-xs text-red-600 dark:text-red-400">Critical Risks</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">{criticalCount}</p>
                    </div>
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950">
                        <p className="text-xs text-orange-600 dark:text-orange-400">High Risks</p>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{highCount}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs text-slate-600 dark:text-slate-400">Total Tracked</p>
                        <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{totalRisks}</p>
                    </div>
                </div>

                {/* Risk Matrix Grid */}
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full">
                        {/* Column Headers (Impact) */}
                        <div className="flex gap-1">
                            <div className="w-24" /> {/* Corner cell for row labels */}
                            {[1, 2, 3, 4, 5].map((impact) => (
                                <div
                                    key={`impact-${impact}`}
                                    className="w-40 border border-slate-200 bg-slate-100 p-2 text-center text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                                >
                                    Impact {impact}
                                </div>
                            ))}
                        </div>

                        {/* Matrix Rows */}
                        {[5, 4, 3, 2, 1].map((likelihood) => (
                            <div key={`row-${likelihood}`} className="flex gap-1">
                                {/* Row Header (Likelihood) */}
                                <div className="w-24 border border-slate-200 bg-slate-100 p-2 text-center text-xs font-semibold dark:border-slate-700 dark:bg-slate-800">
                                    Likelihood {likelihood}
                                </div>

                                {/* Matrix Cells */}
                                {[1, 2, 3, 4, 5].map((impact) => {
                                    const key = `${likelihood}-${impact}`;
                                    const cellRisks = matrixGrid[key] || [];
                                    const severity = calculateSeverity(likelihood, impact);
                                    const severityColor = getSeverityColor(severity);
                                    const severityLabel = getSeverityLabel(severity);

                                    return (
                                        <Dialog key={key}>
                                            <DialogTrigger asChild>
                                                <button
                                                    className={`w-40 min-h-[120px] border border-slate-200 p-2 text-left transition-all hover:shadow-lg dark:border-slate-700 ${severity >= 12 ? "cursor-pointer" : ""
                                                        }`}
                                                    onClick={() => {
                                                        if (cellRisks.length > 0) {
                                                            setSelectedRisk(cellRisks[0]);
                                                        }
                                                    }}
                                                >
                                                    {/* Severity Badge */}
                                                    <div
                                                        className={`mb-2 inline-block rounded px-2 py-1 text-xs font-bold ${severityColor} ${getSeverityTextColor(severity)}`}
                                                    >
                                                        {severityLabel}
                                                    </div>

                                                    {/* Risk Count */}
                                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                                        {cellRisks.length}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {cellRisks.length === 1 ? "risk" : "risks"}
                                                    </p>

                                                    {/* Risk Preview */}
                                                    {cellRisks.length > 0 && (
                                                        <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
                                                            <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                                                                {cellRisks[0].name}
                                                            </p>
                                                            {cellRisks.length > 1 && (
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    +{cellRisks.length - 1} more
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </button>
                                            </DialogTrigger>

                                            {/* Risk Details Dialog */}
                                            {cellRisks.length > 0 && (
                                                <DialogContent className="max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>
                                                            Risks - Likelihood {likelihood} × Impact{" "}
                                                            {impact}
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Severity: {severityLabel} ({severity}/25)
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                                        {cellRisks.map((risk) => (
                                                            <div
                                                                key={risk.id}
                                                                className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                                                            >
                                                                <div className="mb-2 flex items-start justify-between">
                                                                    <div>
                                                                        <h4 className="font-semibold text-slate-900 dark:text-white">
                                                                            {risk.name}
                                                                        </h4>
                                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                                            {risk.description}
                                                                        </p>
                                                                    </div>
                                                                    {risk.trend && (
                                                                        <div className="flex items-center gap-1">
                                                                            {risk.trend === "increasing" && (
                                                                                <ArrowUpRight className="w-4 h-4 text-red-500" />
                                                                            )}
                                                                            {risk.trend === "decreasing" && (
                                                                                <ArrowDownRight className="w-4 h-4 text-green-500" />
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="mb-3 flex gap-2">
                                                                    <Badge variant={getCategoryColor(risk.category)}>
                                                                        {risk.category}
                                                                    </Badge>
                                                                    <Badge
                                                                        variant={
                                                                            risk.status === "open"
                                                                                ? "destructive"
                                                                                : risk.status === "mitigating"
                                                                                    ? "default"
                                                                                    : "outline"
                                                                        }
                                                                    >
                                                                        {risk.status}
                                                                    </Badge>
                                                                </div>

                                                                {risk.mitigation && (
                                                                    <div className="mb-3 rounded bg-blue-50 p-2 dark:bg-blue-950">
                                                                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                                                                            Mitigation Plan:
                                                                        </p>
                                                                        <p className="text-sm text-blue-800 dark:text-blue-300">
                                                                            {risk.mitigation}
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {risk.owner && (
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                        Owner: <span className="font-medium">{risk.owner}</span>
                                                                    </p>
                                                                )}

                                                                <Button
                                                                    size="sm"
                                                                    className="mt-3"
                                                                    onClick={() => {
                                                                        onRiskSelect?.(risk);
                                                                    }}
                                                                >
                                                                    <Eye className="mr-2 w-4 h-4" />
                                                                    View Details
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </DialogContent>
                                            )}
                                        </Dialog>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                        Severity Legend
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded bg-red-500" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                                Critical (20-25)
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded bg-orange-500" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                                High (12-19)
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded bg-yellow-500" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                                Medium (6-11)
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded bg-green-500" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">Low (1-5)</span>
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                {totalRisks === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No risks match the selected filters
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
