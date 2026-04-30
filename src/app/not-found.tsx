import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-destructive/10 border-2 border-destructive flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-mono">404</h1>
          <p className="text-xl font-bold uppercase tracking-wide">
            Page Not Found
          </p>
          <p className="text-sm text-muted-foreground font-mono">
            The requested resource could not be located
          </p>
        </div>
        <Button
          asChild
          className="border-2 text-xs font-mono uppercase tracking-wider"
        >
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
