import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AgentStatus = "active" | "idle" | "processing" | "error";

interface AgentCardProps {
  name: string;
  role: string;
  status: AgentStatus;
  lastAction?: string;
  actionsToday?: number;
}

export function AgentCard({
  name,
  role,
  status,
  lastAction,
  actionsToday = 0,
}: AgentCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "processing":
        return "bg-yellow-500 animate-pulse";
      case "error":
        return "bg-destructive";
      default:
        return "bg-muted-foreground";
    }
  };

  const getStatusBorder = () => {
    switch (status) {
      case "active":
        return "border-green-500/50";
      case "processing":
        return "border-yellow-500/50";
      case "error":
        return "border-destructive/50";
      default:
        return "border-border";
    }
  };

  return (
    <Card className={cn("border-2", getStatusBorder())}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wide">
            {name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2", getStatusColor())} />
            <span className="text-xs font-mono uppercase">{status}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">{role}</p>
        <div className="flex justify-between text-xs font-mono">
          <span className="text-muted-foreground">
            Last: {lastAction || "Never"}
          </span>
          <span>{actionsToday} actions</span>
        </div>
      </CardContent>
    </Card>
  );
}
