"use client";

import { useActiveIncidentCount } from "@/hooks/useIncidents";
import { useWorkflows } from "@/hooks/useWorkflows";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  Building2,
  FileText,
  GitBranch,
  LayoutDashboard,
  Settings2,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number | "dynamic";
  path: string;
};

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, path: "/" },
  {
    id: "workflows",
    label: "Workflows",
    icon: GitBranch,
    badge: "dynamic",
    path: "/workflows",
  },
  { id: "agents", label: "Agents", icon: Bot, path: "/agents" },
  {
    id: "predictions",
    label: "Predictions",
    icon: BarChart3,
    path: "/predictions",
  },
  {
    id: "alerts",
    label: "Alerts",
    icon: AlertTriangle,
    badge: "dynamic",
    path: "/alerts",
  },
  {
    id: "incidents",
    label: "Incidents",
    icon: Shield,
    badge: "dynamic",
    path: "/incidents",
  },
  { id: "reports", label: "Reports", icon: FileText, path: "/reports" },
  {
    id: "ml-training",
    label: "ML Training",
    icon: Brain,
    path: "/ml-training",
  },
  { id: "settings", label: "Settings", icon: Settings2, path: "/settings" },
  {
    id: "acme-corp",
    label: "Acme Corp",
    icon: Building2,
    path: "/acme-corp",
  },
];

interface DashboardNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function DashboardNav({ activeTab, onTabChange }: DashboardNavProps) {
  const pathname = usePathname();
  const { data: activeIncidentCount = 0 } = useActiveIncidentCount();
  const { data: workflowsData } = useWorkflows();
  const workflowCount = workflowsData?.length ?? 0;

  const isActive = (item: NavItem) => {
    if (activeTab) {
      return activeTab === item.id;
    }
    if (item.path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(item.path);
  };

  const getBadge = (item: NavItem): number | undefined => {
    if (item.badge === "dynamic") {
      if (item.id === "incidents" && activeIncidentCount > 0)
        return activeIncidentCount;
      if (item.id === "workflows" && workflowCount > 0) return workflowCount;
      return undefined;
    }
    return item.badge as number | undefined;
  };

  return (
    <nav className="border-b-2 border-border bg-card px-6">
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const badge = getBadge(item);
          const isIncident = item.id === "incidents";

          return (
            <Link
              key={item.id}
              href={item.path}
              onClick={() => onTabChange?.(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium uppercase tracking-wide transition-colors whitespace-nowrap",
                "border-b-2 -mb-0.5",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent",
                isIncident && badge && !active
                  ? "text-orange-400 hover:text-orange-300"
                  : "",
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
              {badge !== undefined && (
                <span
                  className={cn(
                    "text-xs font-mono px-1.5 py-0.5 border",
                    active
                      ? "bg-foreground text-background border-foreground"
                      : isIncident
                        ? "bg-orange-500/15 text-orange-400 border-orange-500/40"
                        : "bg-secondary border-border",
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
