"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentStatus } from "@/data/agentsData";
import { Filter, Search, X } from "lucide-react";
import { useState } from "react";

interface AgentSearchFilterProps {
  onSearchChange: (query: string) => void;
  onStatusFilter: (status: AgentStatus | "all") => void;
  onSeverityFilter: (severity: string | "all") => void;
}

export function AgentSearchFilter({
  onSearchChange,
  onStatusFilter,
  onSeverityFilter,
}: AgentSearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<AgentStatus | "all">(
    "all",
  );
  const [selectedSeverity, setSelectedSeverity] = useState<string | "all">(
    "all",
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  const handleStatusChange = (value: AgentStatus | "all") => {
    setSelectedStatus(value);
    onStatusFilter(value);
  };

  const handleSeverityChange = (value: string | "all") => {
    setSelectedSeverity(value);
    onSeverityFilter(value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedSeverity("all");
    onSearchChange("");
    onStatusFilter("all");
    onSeverityFilter("all");
  };

  const hasActiveFilters =
    searchQuery || selectedStatus !== "all" || selectedSeverity !== "all";

  return (
    <div className="border-2 border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-mono uppercase text-sm tracking-wide">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-mono uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agents, decisions..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-9 font-mono text-sm"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-xs text-muted-foreground uppercase mb-1 block">
            Status
          </label>
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-9 font-mono text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Severity Filter */}
        <div>
          <label className="text-xs text-muted-foreground uppercase mb-1 block">
            Decision Severity
          </label>
          <Select value={selectedSeverity} onValueChange={handleSeverityChange}>
            <SelectTrigger className="h-9 font-mono text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="font-mono text-xs">
                Search: {searchQuery}
              </Badge>
            )}
            {selectedStatus !== "all" && (
              <Badge variant="secondary" className="font-mono text-xs">
                Status: {selectedStatus}
              </Badge>
            )}
            {selectedSeverity !== "all" && (
              <Badge variant="secondary" className="font-mono text-xs">
                Severity: {selectedSeverity}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
