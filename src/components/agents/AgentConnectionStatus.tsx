"use client";

import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle,
  Database,
  FileText,
  Search,
  Shield,
  Target,
  XCircle,
  Zap,
} from "lucide-react";

interface Connection {
  from: string;
  to: string;
  status: "active" | "inactive" | "error";
  lastMessage?: string;
  messageCount: number;
  latency: string;
}

const agentIcons: Record<string, React.ElementType> = {
  analyst: Search,
  forecaster: Target,
  decision: Shield,
  action: Zap,
  monitoring: Database,
  reporting: FileText,
};

const connections: Connection[] = [
  {
    from: "monitoring",
    to: "analyst",
    status: "active",
    lastMessage: "Raw customer KPI batch",
    messageCount: 1240,
    latency: "12ms",
  },
  {
    from: "analyst",
    to: "forecaster",
    status: "active",
    lastMessage: "Risk features extracted",
    messageCount: 842,
    latency: "45ms",
  },
  {
    from: "forecaster",
    to: "decision",
    status: "active",
    lastMessage: "Churn probability vectors",
    messageCount: 842,
    latency: "120ms",
  },
  {
    from: "decision",
    to: "action",
    status: "active",
    lastMessage: "Incident runbook #A82",
    messageCount: 45,
    latency: "280ms",
  },
  {
    from: "action",
    to: "reporting",
    status: "active",
    lastMessage: "SLA confirmation",
    messageCount: 45,
    latency: "15ms",
  },
];

export function AgentConnectionStatus() {
  return (
    <div className="border-2 border-border bg-card">
      <div className="border-b-2 border-border p-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold uppercase tracking-wide text-sm">
            Data Orchestration Mesh
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
            Real-time inter-agent communication channels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Mesh Online</span>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {connections.map((conn, index) => {
          const FromIcon = agentIcons[conn.from] || Activity;
          const ToIcon = agentIcons[conn.to] || Activity;

          return (
            <div
              key={index}
              className={cn(
                "p-3 border border-border flex items-center gap-4 transition-all hover:bg-muted/30",
                conn.status === "active" && "border-l-4 border-l-emerald-500",
                conn.status === "error" && "border-l-4 border-l-red-500 bg-red-500/5",
              )}
            >
              {/* From Agent */}
              <div className="flex items-center gap-2 w-32 shrink-0">
                <div className="w-8 h-8 border border-border bg-secondary/50 flex items-center justify-center">
                  <FromIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono font-bold uppercase truncate">{conn.from}</span>
                  <span className="text-[8px] text-muted-foreground uppercase">Source</span>
                </div>
              </div>

              {/* Connection Wire */}
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-center justify-between w-full px-2">
                  <span className="text-[9px] font-mono text-muted-foreground">{conn.latency}</span>
                  <span className="text-[9px] font-mono text-muted-foreground">{conn.messageCount} tx</span>
                </div>
                <div className="w-full h-1.5 bg-muted relative rounded-full overflow-hidden border border-border">
                  {conn.status === "active" && (
                    <div className="absolute inset-0 flex">
                      <div className="h-full bg-emerald-400/30 w-full animate-pulse" />
                      <div className="h-full bg-emerald-400 w-4 absolute animate-[shimmer_1s_infinite]" 
                           style={{
                             backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                             left: '0%',
                           }} 
                      />
                    </div>
                  )}
                </div>
                <div className="text-[9px] font-mono text-muted-foreground truncate w-full text-center italic">
                  "{conn.lastMessage}"
                </div>
              </div>

              {/* To Agent */}
              <div className="flex items-center gap-2 w-32 shrink-0 justify-end">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-mono font-bold uppercase truncate">{conn.to}</span>
                  <span className="text-[8px] text-muted-foreground uppercase">Receiver</span>
                </div>
                <div className="w-8 h-8 border border-border bg-secondary/50 flex items-center justify-center">
                  <ToIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Status Dot */}
              <div className="shrink-0 ml-2">
                {conn.status === "active" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Footer */}
      <div className="border-t-2 border-border p-3 bg-muted/20 grid grid-cols-3 gap-2">
        <div className="text-center border-r border-border">
          <span className="text-[9px] font-mono uppercase text-muted-foreground block">Active Links</span>
          <span className="text-sm font-mono font-bold">05/05</span>
        </div>
        <div className="text-center border-r border-border">
          <span className="text-[9px] font-mono uppercase text-muted-foreground block">Total Msg Volume</span>
          <span className="text-sm font-mono font-bold">3,012</span>
        </div>
        <div className="text-center">
          <span className="text-[9px] font-mono uppercase text-muted-foreground block">Avg Latency</span>
          <span className="text-sm font-mono font-bold">96ms</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { left: -20%; }
          100% { left: 120%; }
        }
      `}</style>
    </div>
  );
}
