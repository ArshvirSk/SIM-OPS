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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Wand2, Copy, Trash2, Save, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Scenario {
    id: string;
    name: string;
    description?: string;
    parameters: {
        churnRate: number;
        revenueGrowth: number;
        customerAcquisitionCost: number;
        retentionBudget: number;
        agentAutomationRate: number;
    };
    outcomes?: {
        projectedRevenue: number;
        projectedChurn: number;
        projectedROI: number;
        confidenceLevel: number;
    };
    createdAt: Date;
}

interface WhatIfScenarioBuilderProps {
    currentScenario: Scenario;
    onScenarioChange: (scenario: Scenario) => void;
    onCompare: (scenarios: Scenario[]) => void;
}

const DEFAULT_PARAMETERS = {
    churnRate: 5,
    revenueGrowth: 10,
    customerAcquisitionCost: 500,
    retentionBudget: 10000,
    agentAutomationRate: 75,
};

export function WhatIfScenarioBuilder({
    currentScenario,
    onScenarioChange,
    onCompare,
}: WhatIfScenarioBuilderProps) {
    const [scenarios, setScenarios] = useState<Scenario[]>([currentScenario]);
    const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [newScenarioName, setNewScenarioName] = useState("");

    const activeScenario = scenarios.find((s) => s.id === currentScenario.id) || currentScenario;

    const handleParameterChange = (key: keyof Scenario["parameters"], value: number) => {
        const updated = {
            ...activeScenario,
            parameters: {
                ...activeScenario.parameters,
                [key]: value,
            },
        };
        onScenarioChange(updated);
    };

    const calculateOutcomes = (params: Scenario["parameters"]) => {
        // Simplified calculation - in real app, call ML API
        const baseRevenue = 100000;
        const revenueImpact = (params.revenueGrowth / 100) * baseRevenue;
        const churnImpact = params.churnRate * 0.5;
        const automationValue = params.agentAutomationRate * 100;

        return {
            projectedRevenue: baseRevenue + revenueImpact + automationValue,
            projectedChurn: Math.max(0.5, params.churnRate - params.retentionBudget / 10000),
            projectedROI: ((revenueImpact - params.customerAcquisitionCost) / params.customerAcquisitionCost) * 100,
            confidenceLevel: 85,
        };
    };

    const handleDuplicateScenario = (scenario: Scenario) => {
        const newScenario: Scenario = {
            ...scenario,
            id: `scenario-${Date.now()}`,
            name: `${scenario.name} (Copy)`,
        };
        setScenarios([...scenarios, newScenario]);
        toast.success("Scenario duplicated");
    };

    const handleDeleteScenario = (id: string) => {
        if (scenarios.length <= 1) {
            toast.error("Cannot delete the last scenario");
            return;
        }
        setScenarios(scenarios.filter((s) => s.id !== id));
        toast.success("Scenario deleted");
    };

    const handleCreateScenario = () => {
        if (!newScenarioName.trim()) {
            toast.error("Please enter a scenario name");
            return;
        }

        const newScenario: Scenario = {
            id: `scenario-${Date.now()}`,
            name: newScenarioName,
            parameters: DEFAULT_PARAMETERS,
            createdAt: new Date(),
        };

        setScenarios([...scenarios, newScenario]);
        onScenarioChange(newScenario);
        setNewScenarioName("");
        setOpenDialog(false);
        toast.success("Scenario created");
    };

    const handleCompareScenarios = () => {
        const scenariosToCompare = scenarios.filter((s) =>
            selectedScenarios.includes(s.id)
        );
        if (scenariosToCompare.length < 2) {
            toast.error("Select at least 2 scenarios to compare");
            return;
        }
        onCompare(scenariosToCompare);
    };

    return (
        <div className="space-y-6">
            {/* Scenario Tabs */}
            <Tabs value={currentScenario.id} onValueChange={(id) => {
                const scenario = scenarios.find((s) => s.id === id);
                if (scenario) onScenarioChange(scenario);
            }}>
                <div className="flex items-center justify-between">
                    <TabsList className="border-2">
                        {scenarios.map((scenario) => (
                            <TabsTrigger key={scenario.id} value={scenario.id}>
                                {scenario.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-2">
                                <Plus className="w-4 h-4" />
                                New Scenario
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Scenario</DialogTitle>
                                <DialogDescription>
                                    Build a new what-if scenario to explore different outcomes
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Scenario Name</Label>
                                    <Input
                                        placeholder="e.g., Aggressive Growth, Conservative"
                                        value={newScenarioName}
                                        onChange={(e) => setNewScenarioName(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleCreateScenario} className="w-full">
                                    Create Scenario
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Parameter Controls */}
                {scenarios.map((scenario) => (
                    <TabsContent key={scenario.id} value={scenario.id} className="space-y-6">
                        {/* Parameter Sliders */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Scenario Parameters</CardTitle>
                                <CardDescription>
                                    Adjust parameters to see how they impact outcomes
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Churn Rate */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <Label>Monthly Churn Rate (%)</Label>
                                        <Badge variant="secondary">{scenario.parameters.churnRate}%</Badge>
                                    </div>
                                    <Slider
                                        min={0}
                                        max={15}
                                        step={0.1}
                                        value={[scenario.parameters.churnRate]}
                                        onValueChange={(value) =>
                                            handleParameterChange("churnRate", value[0])
                                        }
                                        className="w-full"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Current industry benchmark: 5%
                                    </p>
                                </div>

                                {/* Revenue Growth */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <Label>Revenue Growth Target (%)</Label>
                                        <Badge variant="secondary">{scenario.parameters.revenueGrowth}%</Badge>
                                    </div>
                                    <Slider
                                        min={-20}
                                        max={50}
                                        step={1}
                                        value={[scenario.parameters.revenueGrowth]}
                                        onValueChange={(value) =>
                                            handleParameterChange("revenueGrowth", value[0])
                                        }
                                        className="w-full"
                                    />
                                </div>

                                {/* Customer Acquisition Cost */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <Label>Customer Acquisition Cost ($)</Label>
                                        <Badge variant="secondary">
                                            ${scenario.parameters.customerAcquisitionCost}
                                        </Badge>
                                    </div>
                                    <Slider
                                        min={100}
                                        max={2000}
                                        step={50}
                                        value={[scenario.parameters.customerAcquisitionCost]}
                                        onValueChange={(value) =>
                                            handleParameterChange("customerAcquisitionCost", value[0])
                                        }
                                        className="w-full"
                                    />
                                </div>

                                {/* Retention Budget */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <Label>Monthly Retention Budget ($)</Label>
                                        <Badge variant="secondary">
                                            ${scenario.parameters.retentionBudget.toLocaleString()}
                                        </Badge>
                                    </div>
                                    <Slider
                                        min={0}
                                        max={50000}
                                        step={1000}
                                        value={[scenario.parameters.retentionBudget]}
                                        onValueChange={(value) =>
                                            handleParameterChange("retentionBudget", value[0])
                                        }
                                        className="w-full"
                                    />
                                </div>

                                {/* Agent Automation Rate */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <Label>AI Agent Automation Rate (%)</Label>
                                        <Badge variant="secondary">
                                            {scenario.parameters.agentAutomationRate}%
                                        </Badge>
                                    </div>
                                    <Slider
                                        min={0}
                                        max={100}
                                        step={5}
                                        value={[scenario.parameters.agentAutomationRate]}
                                        onValueChange={(value) =>
                                            handleParameterChange("agentAutomationRate", value[0])
                                        }
                                        className="w-full"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Higher automation = more AI decisions, faster execution
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Projected Outcomes */}
                        {scenario.outcomes || (scenario.outcomes = calculateOutcomes(scenario.parameters))} && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Projected Outcomes</CardTitle>
                                <CardDescription>
                                    Based on current parameter settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-secondary rounded-lg p-4 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Revenue Impact
                                        </p>
                                        <p className="text-2xl font-bold flex items-center justify-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-green-500" />
                                            ${scenario.outcomes?.projectedRevenue.toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="bg-secondary rounded-lg p-4 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Churn Rate
                                        </p>
                                        <p className="text-2xl font-bold flex items-center justify-center gap-2">
                                            <TrendingDown className="w-5 h-5 text-green-500" />
                                            {scenario.outcomes?.projectedChurn.toFixed(2)}%
                                        </p>
                                    </div>

                                    <div className="bg-secondary rounded-lg p-4 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Projected ROI
                                        </p>
                                        <p className="text-2xl font-bold text-blue-500">
                                            {scenario.outcomes?.projectedROI.toFixed(1)}%
                                        </p>
                                    </div>

                                    <div className="bg-secondary rounded-lg p-4 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Confidence
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {scenario.outcomes?.confidenceLevel}%
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
            )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDuplicateScenario(scenario)}
                                className="gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                Duplicate
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteScenario(scenario.id)}
                                className="gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (!selectedScenarios.includes(scenario.id)) {
                                        setSelectedScenarios([...selectedScenarios, scenario.id]);
                                    }
                                }}
                                className="gap-2"
                            >
                                <Wand2 className="w-4 h-4" />
                                {selectedScenarios.includes(scenario.id)
                                    ? "Selected for Compare"
                                    : "Select for Compare"}
                            </Button>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Compare Button */}
            {selectedScenarios.length >= 2 && (
                <Button onClick={handleCompareScenarios} className="w-full gap-2 bg-blue-600">
                    <Wand2 className="w-4 h-4" />
                    Compare {selectedScenarios.length} Scenarios
                </Button>
            )}
        </div>
    );
}
