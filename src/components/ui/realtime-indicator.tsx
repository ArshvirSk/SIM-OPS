"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    // Monitor connection status
    const channel = supabase.channel("connection-monitor");

    channel
      .on("system", {}, (payload) => {
        if (payload.extension === "postgres_changes") {
          setIsConnected(true);
          setUpdateCount((prev) => prev + 1);
        }
      })
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      {isConnected ? (
        <>
          <div className="relative">
            <Wifi className="w-4 h-4 text-green-500" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span className="text-muted-foreground">
            Live {updateCount > 0 && `(${updateCount})`}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Offline</span>
        </>
      )}
    </div>
  );
}
