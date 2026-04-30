"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import {
  AlertTriangle,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Segment {
  name: string;
  count: number;
  avgChurnRisk: number;
  avgCLV?: number;
  color: string;
  description: string;
}

interface CustomerSegmentData {
  customer_id: string;
  churn_risk: number;
  clv?: number;
  segment: string;
}

export function CustomerSegmentation() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [customerData, setCustomerData] = useState<CustomerSegmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const supabase = createClient();

      // Get all churn predictions
      const { data: churnPredictions } = await supabase
        .from("ml_predictions")
        .select("*")
        .eq("prediction_type", "churn")
        .order("created_at", { ascending: false });

      if (!churnPredictions || churnPredictions.length === 0) {
        generateMockSegments();
        return;
      }

      // Get latest prediction per customer
      const latestByCustomer = new Map();
      churnPredictions.forEach((pred) => {
        if (!latestByCustomer.has(pred.customer_id)) {
          latestByCustomer.set(pred.customer_id, pred);
        }
      });

      // Get CLV predictions
      const { data: clvPredictions } = await supabase
        .from("ml_predictions")
        .select("*")
        .eq("prediction_type", "clv")
        .order("created_at", { ascending: false });

      const clvMap = new Map();
      if (clvPredictions) {
        clvPredictions.forEach((pred) => {
          if (!clvMap.has(pred.customer_id)) {
            clvMap.set(
              pred.customer_id,
              pred.prediction_data?.predicted_clv || 0,
            );
          }
        });
      }

      // Segment customers
      const customerDataArray: CustomerSegmentData[] = [];
      Array.from(latestByCustomer.values()).forEach((pred) => {
        const churnRisk = pred.prediction_data?.churn_probability || 0;
        const clv = clvMap.get(pred.customer_id) || 0;

        let segment = "";
        if (churnRisk > 0.7 && clv > 5000) {
          segment = "high-value-at-risk";
        } else if (churnRisk > 0.7) {
          segment = "high-risk";
        } else if (churnRisk < 0.3 && clv > 5000) {
          segment = "champions";
        } else if (churnRisk < 0.3) {
          segment = "loyal";
        } else if (clv > 5000) {
          segment = "high-value";
        } else {
          segment = "standard";
        }

        customerDataArray.push({
          customer_id: pred.customer_id,
          churn_risk: churnRisk,
          clv,
          segment,
        });
      });

      setCustomerData(customerDataArray);
      setTotalCustomers(customerDataArray.length);

      // Calculate segment statistics
      const segmentStats: {
        [key: string]: { count: number; totalRisk: number; totalCLV: number };
      } = {};

      customerDataArray.forEach((customer) => {
        if (!segmentStats[customer.segment]) {
          segmentStats[customer.segment] = {
            count: 0,
            totalRisk: 0,
            totalCLV: 0,
          };
        }
        const stats = segmentStats[customer.segment];
        if (stats) {
          stats.count++;
          stats.totalRisk += customer.churn_risk;
          stats.totalCLV += customer.clv || 0;
        }
      });

      const segmentColors: { [key: string]: string } = {
        champions: "hsl(142, 76%, 36%)",
        "high-value": "hsl(217, 91%, 60%)",
        loyal: "hsl(158, 64%, 52%)",
        "high-value-at-risk": "hsl(0, 84%, 60%)",
        "high-risk": "hsl(25, 95%, 53%)",
        standard: "hsl(215, 20%, 65%)",
      };

      const segmentDescriptions: { [key: string]: string } = {
        champions: "Low churn risk, high value - Your best customers",
        "high-value": "High value customers with moderate risk",
        loyal: "Low churn risk, standard value - Stable customer base",
        "high-value-at-risk":
          "CRITICAL: High value customers at risk of churning",
        "high-risk": "High churn risk - Needs immediate attention",
        standard: "Average customers with moderate engagement",
      };

      const segmentArray: Segment[] = Object.entries(segmentStats).map(
        ([name, stats]) => ({
          name: name
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          count: stats.count,
          avgChurnRisk: stats.totalRisk / stats.count,
          avgCLV: stats.totalCLV / stats.count,
          color: segmentColors[name] || "hsl(215, 20%, 65%)",
          description: segmentDescriptions[name] || "",
        }),
      );

      setSegments(segmentArray.sort((a, b) => b.count - a.count));
    } catch (error) {
      console.error("Failed to load segments:", error);
      generateMockSegments();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateMockSegments = () => {
    const mockSegments: Segment[] = [
      {
        name: "Champions",
        count: 245,
        avgChurnRisk: 0.15,
        avgCLV: 12500,
        color: "hsl(142, 76%, 36%)",
        description: "Low churn risk, high value - Your best customers",
      },
      {
        name: "Loyal",
        count: 432,
        avgChurnRisk: 0.22,
        avgCLV: 3200,
        color: "hsl(158, 64%, 52%)",
        description: "Low churn risk, standard value - Stable customer base",
      },
      {
        name: "High Value",
        count: 156,
        avgChurnRisk: 0.45,
        avgCLV: 8900,
        color: "hsl(217, 91%, 60%)",
        description: "High value customers with moderate risk",
      },
      {
        name: "Standard",
        count: 678,
        avgChurnRisk: 0.52,
        avgCLV: 2100,
        color: "hsl(215, 20%, 65%)",
        description: "Average customers with moderate engagement",
      },
      {
        name: "High Risk",
        count: 89,
        avgChurnRisk: 0.78,
        avgCLV: 1800,
        color: "hsl(25, 95%, 53%)",
        description: "High churn risk - Needs immediate attention",
      },
      {
        name: "High Value At Risk",
        count: 34,
        avgChurnRisk: 0.82,
        avgCLV: 9500,
        color: "hsl(0, 84%, 60%)",
        description: "CRITICAL: High value customers at risk of churning",
      },
    ];

    setSegments(mockSegments);
    setTotalCustomers(mockSegments.reduce((sum, s) => sum + s.count, 0));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Segmentation</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  const highValueAtRisk = segments.find((s) => s.name.includes("At Risk"));
  const champions = segments.find((s) => s.name === "Champions");
  const totalValue = segments.reduce(
    (sum, s) => sum + (s.avgCLV || 0) * s.count,
    0,
  );
  const avgChurnRisk =
    segments.reduce((sum, s) => sum + s.avgChurnRisk * s.count, 0) /
    totalCustomers;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Segmentation Analysis</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                ML-powered customer segments based on churn risk and lifetime
                value
              </p>
            </div>
            <Button
              onClick={loadSegments}
              disabled={refreshing}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-3xl font-bold">
                  {totalCustomers.toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Champions</p>
                <p className="text-3xl font-bold text-green-600">
                  {champions?.count || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  High Value at Risk
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {highValueAtRisk?.count || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Churn Risk</p>
                <p className="text-3xl font-bold text-orange-600">
                  {(avgChurnRisk * 100).toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="matrix">Risk-Value Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Segment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((segment) => (
              <Card
                key={segment.name}
                className="border-l-4"
                style={{ borderLeftColor: segment.color }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{segment.name}</CardTitle>
                    <Badge variant="secondary">{segment.count} customers</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {segment.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Avg Churn Risk
                      </span>
                      <span
                        className={`font-bold ${
                          segment.avgChurnRisk > 0.7
                            ? "text-red-600"
                            : segment.avgChurnRisk > 0.4
                              ? "text-orange-600"
                              : "text-green-600"
                        }`}
                      >
                        {(segment.avgChurnRisk * 100).toFixed(1)}%
                      </span>
                    </div>
                    {segment.avgCLV && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Avg CLV</span>
                        <span className="font-bold">
                          ${segment.avgCLV.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">% of Total</span>
                      <span className="font-bold">
                        {((segment.count / totalCustomers) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Customer Distribution by Segment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={segments}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {segments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={segments}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        name="Customers"
                        fill="hsl(var(--primary))"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Churn Risk vs Customer Value Matrix
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Each dot represents a customer segment
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      dataKey="avgChurnRisk"
                      name="Churn Risk"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Churn Risk",
                        position: "insideBottom",
                        offset: -5,
                      }}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    />
                    <YAxis
                      type="number"
                      dataKey="avgCLV"
                      name="CLV"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Customer Lifetime Value",
                        angle: -90,
                        position: "insideLeft",
                      }}
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip
                      formatter={(value: any, name: string | undefined) => {
                        if (name === "Churn Risk")
                          return `${(value * 100).toFixed(1)}%`;
                        if (name === "CLV") return `$${value.toLocaleString()}`;
                        return value;
                      }}
                      cursor={{ strokeDasharray: "3 3" }}
                    />
                    <Legend />
                    <Scatter
                      name="Segments"
                      data={segments}
                      fill="hsl(var(--primary))"
                    >
                      {segments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {segments.map((segment) => (
                  <div
                    key={segment.name}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span>{segment.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
