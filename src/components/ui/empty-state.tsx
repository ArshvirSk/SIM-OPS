import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[300px] p-8">
      <div className="text-center space-y-4 max-w-md">
        {Icon && (
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Icon className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-lg font-bold uppercase tracking-wide">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          <Button onClick={action.onClick} size="sm">
            {action.label}
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}
