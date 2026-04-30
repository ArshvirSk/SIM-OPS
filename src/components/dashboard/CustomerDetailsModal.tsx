"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Calendar,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { CustomerPredictionHistory } from "./CustomerPredictionHistory";

interface CustomerDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  prediction: {
    churn_probability: number;
    risk_level: string;
    contributing_factors?: Array<{
      factor: string;
      importance: number;
      value: number;
    }>;
    recommended_actions?: string[];
  };
  confidence: number;
}

export function CustomerDetailsModal({
  open,
  onOpenChange,
  customerId,
  prediction,
  confidence,
}: CustomerDetailsModalProps) {
  const riskColor =
    prediction.risk_level === "critical"
      ? "text-red-600"
      : prediction.risk_level === "high"
        ? "text-orange-600"
        : "text-yellow-600";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer: {customerId}
          </DialogTitle>
          <DialogDescription>
            Detailed churn risk analysis and prediction history
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Risk Overview */}
          <div className="border rounded-lg p-6 bg-gradient-to-br from-background to-muted/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Churn Risk Score
                </p>
                <p className={`text-4xl font-bold ${riskColor}`}>
                  {(prediction.churn_probability * 100).toFixed(1)}%
                </p>
              </div>
              <Badge
                variant={
                  prediction.risk_level === "critical"
                    ? "destructive"
                    : prediction.risk_level === "high"
                      ? "default"
                      : "secondary"
                }
                className="text-lg px-4 py-2"
              >
                {prediction.risk_level.toUpperCase()}
              </Badge>
            </div>
            <Progress
              value={prediction.churn_probability * 100}
              className="h-3"
            />
            <div className="flex items-center gap-2 mt-3">
              <Target className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Model Confidence: {(confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Contributing Factors */}
          {prediction.contributing_factors &&
            prediction.contributing_factors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Contributing Factors
                </h3>
                <div className="space-y-3">
                  {prediction.contributing_factors
                    .sort((a, b) => b.importance - a.importance)
                    .map((factor, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{factor.factor}</span>
                          <Badge variant="outline">
                            {(factor.importance * 100).toFixed(0)}% impact
                          </Badge>
                        </div>
                        <Progress
                          value={factor.importance * 100}
                          className="h-2"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          Value:{" "}
                          {typeof factor.value === "number"
                            ? factor.value.toFixed(2)
                            : factor.value}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* Recommended Actions */}
          {prediction.recommended_actions &&
            prediction.recommended_actions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recommended Actions
                </h3>
                <div className="space-y-2">
                  {prediction.recommended_actions.map((action, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {idx + 1}
                      </div>
                      <p className="flex-1 text-sm">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Prediction History */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historical Trends
            </h3>
            <CustomerPredictionHistory customerId={customerId} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
