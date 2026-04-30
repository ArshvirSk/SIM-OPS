"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { FileSpreadsheet, FileText } from "lucide-react";

interface ExportMLReportsProps {
  predictionType?: "churn" | "anomaly" | "revenue" | "all";
  title?: string;
}

export function ExportMLReports({
  predictionType = "all",
  title = "Export ML Reports",
}: ExportMLReportsProps) {
  const { toast } = useToast();

  const exportToCSV = async () => {
    try {
      const supabase = createClient();

      let query = supabase
        .from("ml_predictions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (predictionType !== "all") {
        query = query.eq("prediction_type", predictionType);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No predictions available to export",
          variant: "destructive",
        });
        return;
      }

      // Convert to CSV
      const headers = ["Date", "Customer ID", "Type", "Confidence", "Details"];
      const rows = data.map((pred) => [
        new Date(pred.created_at).toLocaleDateString(),
        pred.customer_id,
        pred.prediction_type,
        (pred.confidence * 100).toFixed(1) + "%",
        JSON.stringify(pred.prediction_data),
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ml-predictions-${predictionType}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${data.length} predictions to CSV`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export predictions",
        variant: "destructive",
      });
    }
  };

  const exportToJSON = async () => {
    try {
      const supabase = createClient();

      let query = supabase
        .from("ml_predictions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (predictionType !== "all") {
        query = query.eq("prediction_type", predictionType);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No predictions available to export",
          variant: "destructive",
        });
        return;
      }

      // Download JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ml-predictions-${predictionType}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${data.length} predictions to JSON`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export predictions",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={exportToCSV} variant="outline" className="flex-1">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={exportToJSON} variant="outline" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Export up to 1,000 most recent predictions
        </p>
      </CardContent>
    </Card>
  );
}
