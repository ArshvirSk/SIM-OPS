"use client";

import { cn } from "@/lib/utils";
import { Activity, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

interface LiveDataFlowIndicatorProps {
  isConnected?: boolean;
  packetsPerSecond?: number;
  latency?: number;
}

export function LiveDataFlowIndicator({
  isConnected = true,
  packetsPerSecond = 0,
  latency = 0,
}: LiveDataFlowIndicatorProps) {
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setPulseCount((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 border-2",
        isConnected
          ? "border-foreground bg-secondary"
          : "border-destructive bg-destructive/10",
      )}
    >
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4 text-destructive" />
        )}
        <span className="text-xs font-mono uppercase tracking-wide">
          {isConnected ? "Live" : "Disconnected"}
        </span>
      </div>

      {isConnected && (
        <>
          <div className="w-px h-4 bg-border" />

          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-mono">
              {packetsPerSecond.toFixed(1)} p/s
            </span>
          </div>

          <div className="w-px h-4 bg-border" />

          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-1 transition-all duration-200",
                  pulseCount % 4 >= i
                    ? "h-3 bg-foreground"
                    : "h-1 bg-muted-foreground",
                )}
              />
            ))}
          </div>

          <div className="w-px h-4 bg-border" />

          <span className="text-xs font-mono text-muted-foreground">
            {latency}ms
          </span>
        </>
      )}
    </div>
  );
}
