import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
  content: string | React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  iconClassName?: string;
}

export function InfoTooltip({
  content,
  side = "top",
  className = "",
  iconClassName = "",
}: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors ${className}`}
            onClick={(e) => e.preventDefault()}
          >
            <Info
              className={`w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors ${iconClassName}`}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs text-xs leading-relaxed"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface InfoBadgeProps {
  title: string;
  description: string | React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

export function InfoBadge({ title, description, side = "top" }: InfoBadgeProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            <Info className="w-3 h-3" />
            <span>{title}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-sm text-xs leading-relaxed"
        >
          <div className="space-y-1">
            <p className="font-semibold">{title}</p>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
