"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useAgentCommunications, useAgents } from "@/hooks/useAgents";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Brain,
  Eye,
  FileText,
  RefreshCw,
  Scale,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface DataPacket {
  id: string;
  from: string;
  to: string;
  type:
    | "kpi"
    | "prediction"
    | "decision"
    | "action"
    | "report"
    | "feedback"
    | "data"
    | "alert";
  data: string;
  timestamp: number;
}

interface AgentNode {
  id: string;
  name: string;
  icon: React.ElementType;
  status: "idle" | "processing" | "active";
  position: number;
}

const AGENT_ICONS: Record<string, React.ElementType> = {
  monitoring: Eye,
  prediction: Brain,
  decision: Scale,
  action: Zap,
  reporting: FileText,
  feedback: RefreshCw,
};

const AGENT_ORDER = [
  "monitoring",
  "prediction",
  "decision",
  "action",
  "reporting",
  "feedback",
];

function getAgentType(name: string, role?: string): string {
  const r = role?.toLowerCase() || "";
  const n = name.toLowerCase();
  
  // Prioritize role matching
  if (AGENT_ORDER.includes(r)) return r;
  
  // Fallback to name matching with common synonyms
  if (n.includes("monitor") || n.includes("analyst") || r.includes("monitor")) return "monitoring";
  if (n.includes("predict") || n.includes("forecast") || r.includes("predict")) return "prediction";
  if (n.includes("decision") || n.includes("evaluator")) return "decision";
  if (n.includes("action") || n.includes("executor")) return "action";
  if (n.includes("report")) return "reporting";
  if (n.includes("feedback")) return "feedback";
  
  return AGENT_ORDER.find((t) => n.includes(t)) || "monitoring";
}

/**
 * The 6 canonical pipeline agents — always shown, always in this order.
 */
const PIPELINE_AGENTS = [
  { id: "monitoring", name: "Monitor",    icon: Eye,        position: 0 },
  { id: "prediction", name: "Predictor",  icon: Brain,      position: 1 },
  { id: "decision",   name: "Decision",   icon: Scale,      position: 2 },
  { id: "action",     name: "Action",     icon: Zap,        position: 3 },
  { id: "reporting",  name: "Reporter",   icon: FileText,   position: 4 },
  { id: "feedback",   name: "Feedback",   icon: RefreshCw,  position: 5 },
] as const;

export function AgentCommunicationPipeline() {
  const { data: dbAgents, isLoading: agentsLoading } = useAgents();
  const { data: communications, isLoading: commsLoading } =
    useAgentCommunications();
  const [isPaused, setIsPaused] = useState(false);
  const [activeTransfer, setActiveTransfer] = useState<{
    from: number;
    to: number;
  } | null>(null);

  // Build agent nodes — always show the 4 canonical agents, merge DB status
  const agents: AgentNode[] = useMemo(() => {
    const dbMap = new Map((dbAgents || []).map((a) => [a.id, a]));
    return PIPELINE_AGENTS.map((pa) => {
      const dbRow = dbMap.get(pa.id);
      return {
        id: pa.id,
        name: pa.name,
        icon: pa.icon,
        status: (dbRow?.status as "idle" | "processing" | "active") || "idle",
        position: pa.position,
      };
    });
  }, [dbAgents]);

  // Build message log from real communications - memoized
  const messageLog: DataPacket[] = useMemo(
    () =>
      (communications || [])
        .slice(0, 10)
        .map((comm) => {
          const fromAgent = agents.find((a) => a.id === comm.from_agent_id);
          const toAgent = agents.find((a) => a.id === comm.to_agent_id);
          return {
            id: comm.id,
            from: fromAgent?.name || "Unknown",
            to: toAgent?.name || "Unknown",
            type: (comm.message_type as DataPacket["type"]) || "data",
            data:
              typeof comm.payload === "object" && comm.payload !== null
                ? typeof comm.payload === "object" && "summary" in comm.payload
                  ? String((comm.payload as { summary: unknown }).summary)
                  : JSON.stringify(comm.payload).substring(0, 50)
                : String(comm.payload || ""),
            timestamp: new Date(comm.created_at).getTime(),
          };
        }),
    [communications, agents]
  );

  // Animate active transfer when new communication arrives
  useEffect(() => {
    if (isPaused || !communications || communications.length === 0) return;

    const latestComm = communications[0];
    const fromIdx = agents.findIndex((a) => a.id === latestComm.from_agent_id);
    const toIdx = agents.findIndex((a) => a.id === latestComm.to_agent_id);

    if (fromIdx >= 0 && toIdx >= 0) {
      setActiveTransfer({ from: fromIdx, to: toIdx });
      const timer = setTimeout(() => setActiveTransfer(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [communications, isPaused, agents]);

  const activePackets = messageLog.slice(0, 3);

  const getPacketColor = (type: DataPacket["type"]) => {
    switch (type) {
      case "kpi":
        return "bg-secondary";
      case "prediction":
        return "bg-accent";
      case "decision":
        return "bg-primary";
      case "action":
        return "bg-foreground";
      case "report":
        return "bg-muted";
      case "feedback":
        return "bg-secondary";
      default:
        return "bg-muted";
    }
  };

  if (agentsLoading || commsLoading) {
    return (
      <div className="border-2 border-border bg-card p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="border-2 border-border bg-card">
      {/* Header */}
      <div className="border-b-2 border-border p-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold uppercase tracking-wide text-sm">
            Real-Time Agent Communication
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Live data flow between decision agents
          </p>
        </div>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={cn(
            "px-3 py-1 border-2 text-xs font-mono uppercase tracking-wide transition-colors",
            isPaused
              ? "border-muted-foreground bg-muted text-muted-foreground"
              : "border-foreground bg-foreground text-background",
          )}
        >
          {isPaused ? "Resume" : "Pause"}
        </button>
      </div>

      {/* Pipeline Visualization */}
      <div className="p-6">
        <div className="relative">
          {/* Connection Lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ height: "120px" }}
            viewBox="0 0 1000 120"
            preserveAspectRatio="none"
          >
            {agents.length > 1 && agents.slice(0, -1).map((agent, index) => {
              const startX = (index / (agents.length - 1)) * 1000;
              const endX = ((index + 1) / (agents.length - 1)) * 1000;
              const isActive =
                activeTransfer &&
                activeTransfer.from === index &&
                activeTransfer.to === index + 1;

              return (
                <g key={agent.id}>
                  <line
                    x1={startX}
                    y1="60"
                    x2={endX}
                    y2="60"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={cn(
                      "text-border transition-colors",
                      isActive && "text-foreground",
                    )}
                    vectorEffect="non-scaling-stroke"
                  />
                  {isActive && (
                    <circle
                      r="4"
                      fill="currentColor"
                      className="text-foreground"
                    >
                      <animate
                        attributeName="cx"
                        from={startX}
                        to={endX}
                        dur="0.8s"
                        repeatCount="1"
                      />
                      <animate attributeName="cy" values="60;60" dur="0.8s" />
                    </circle>
                  )}
                </g>
              );
            })}
            {/* Feedback loop line - only show if we have agents */}
            {agents.length > 0 && (
              <path
                d="M 950 60 Q 1000 60 1000 90 L 1000 110 Q 1000 120 950 120 L 50 120 Q 0 120 0 110 L 0 90 Q 0 60 50 60"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="text-muted-foreground/50"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* Agent Nodes */}
          <div
            className="relative flex items-center justify-between"
            style={{ height: "120px" }}
          >
            {agents.map((agent) => {
              const Icon = agent.icon;
              const isProcessing = agent.status === "processing";
              const isActive = agent.status === "active" || isProcessing;

              return (
                <div key={agent.id} className="flex flex-col items-center z-10">
                  <div
                    className={cn(
                      "w-14 h-14 border-2 flex items-center justify-center transition-all duration-300",
                      isProcessing &&
                        "border-foreground bg-foreground text-background animate-pulse",
                      agent.status === "active" &&
                        "border-foreground bg-secondary",
                      agent.status === "idle" && "border-border bg-card",
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-mono mt-2 uppercase tracking-wide transition-colors",
                      isActive
                        ? "text-foreground font-bold"
                        : "text-muted-foreground",
                    )}
                  >
                    {agent.name}
                  </span>
                  {isProcessing && (
                    <span className="text-[10px] text-muted-foreground mt-1 animate-pulse">
                      Processing...
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Data Packets */}
      <div className="border-t-2 border-border p-4">
        <h4 className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-3">
          Active Data Flow
        </h4>
        <div className="space-y-2 min-h-[80px]">
          {activePackets.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No recent communications. Run agents to see data flow.
            </p>
          ) : (
            activePackets.map((packet, index) => (
              <div
                key={packet.id}
                className={cn(
                  "flex items-center gap-3 p-2 border-2 border-border bg-background animate-fade-in",
                  index === activePackets.length - 1 && "border-foreground",
                )}
              >
                <div className={cn("w-2 h-2", getPacketColor(packet.type))} />
                <span className="text-xs font-mono uppercase">
                  {packet.from}
                </span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-mono uppercase">{packet.to}</span>
                <span className="text-xs text-muted-foreground ml-auto font-mono">
                  {packet.data}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Log */}
      <div className="border-t-2 border-border p-4">
        <h4 className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-3">
          Communication Log
        </h4>
        <div className="space-y-1 max-h-[150px] overflow-y-auto">
          {messageLog.map((packet) => (
            <div
              key={packet.id}
              className="flex items-center gap-2 text-xs font-mono"
            >
              <span className="text-muted-foreground w-20">
                {new Date(packet.timestamp).toLocaleTimeString()}
              </span>
              <span className="uppercase">{packet.from}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className="uppercase">{packet.to}</span>
              <span className="text-muted-foreground truncate">
                {packet.data}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
