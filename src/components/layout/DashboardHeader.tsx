"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RealtimeIndicator } from "@/components/ui/realtime-indicator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Bell, LogOut, RefreshCw, Settings } from "lucide-react";
import Image from "next/image";

interface DashboardHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DashboardHeader({
  onRefresh,
  isRefreshing,
}: DashboardHeaderProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleNotifications = () => {
    toast({
      title: "System Notifications",
      description:
        "You have 3 automated actions pending review in the Action Agent queue.",
    });
  };

  return (
    <header className="border-b-2 border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <Image
                src="/simops-logo.png"
                alt="SIM-OPS Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wide">
                SIM-OPS
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                Smart Intelligence Management
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RealtimeIndicator />

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border-2 border-border bg-secondary text-xs font-mono">
            <div className="w-2 h-2 bg-foreground animate-pulse" />
            <span>SYSTEM ACTIVE</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="border-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="border-2 relative"
            onClick={handleNotifications}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive border border-background" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-2">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Account</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
