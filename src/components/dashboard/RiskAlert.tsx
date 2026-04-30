import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight, DollarSign, TrendingDown } from "lucide-react";
import Link from "next/link";

type RiskType = "churn" | "revenue" | "cost";
type Severity = "low" | "medium" | "high" | "critical";

interface RiskAlertProps {
  id: string;
  type: RiskType;
  title: string;
  description: string;
  severity: Severity;
  probability: number;
  timestamp: string;
}

export function RiskAlert({
  id,
  type,
  title,
  description,
  severity,
  probability,
  timestamp,
}: RiskAlertProps) {
  const getIcon = () => {
    switch (type) {
      case "churn":
        return <TrendingDown className="w-4 h-4" />;
      case "revenue":
        return <DollarSign className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case "critical":
        return "border-destructive bg-destructive/10";
      case "high":
        return "border-orange-500 bg-orange-500/10";
      case "medium":
        return "border-yellow-500 bg-yellow-500/10";
      default:
        return "border-border";
    }
  };

  return (
    <Card className={cn("border-2", getSeverityColor())}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <CardTitle className="text-sm font-bold uppercase tracking-wide">
              {title}
            </CardTitle>
          </div>
          <span className="text-xs font-mono uppercase px-2 py-0.5 border">
            {severity}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-xs font-mono">
            <span>Probability: {probability}%</span>
            <span className="text-muted-foreground">{timestamp}</span>
          </div>
          <Link
            href={`/agents`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0 ml-3"
          >
            View in Agents
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
