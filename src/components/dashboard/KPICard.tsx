import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  predicted?: string;
  icon?: React.ReactNode;
  status?: "healthy" | "warning" | "critical";
  isNegativeGood?: boolean;
  infoContent?: string | React.ReactNode;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = "vs predicted",
  predicted,
  icon,
  status = "healthy",
  isNegativeGood = false,
  infoContent,
}: KPICardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "critical":
        return "border-destructive";
      case "warning":
        return "border-yellow-500";
      default:
        return "border-border";
    }
  };

  const getChangeColor = () => {
    if (change === undefined || change === 0) return "text-muted-foreground";
    const isPositive = change > 0;
    if (isNegativeGood) {
      return isPositive ? "text-destructive" : "text-green-500";
    }
    return isPositive ? "text-green-500" : "text-destructive";
  };

  return (
    <Card className={cn("border-2", getStatusColor())}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {title}
            </CardTitle>
            {infoContent && <InfoTooltip content={infoContent} />}
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-xs font-mono", getChangeColor())}>
              {change > 0 ? "+" : ""}
              {change}%
            </span>
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          </div>
        )}
        {predicted && (
          <div className="text-xs text-muted-foreground mt-1 font-mono">
            Predicted: {predicted}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
