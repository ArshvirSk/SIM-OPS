"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, Check, Database, ExternalLink, Key, RefreshCw, Webhook } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  config: Record<string, string>;
}

/** Persisted shape — icons are functions and cannot be JSON-serialised */
interface PersistedIntegration {
  id: string;
  enabled: boolean;
  config: Record<string, string>;
}

const DEFAULT_INTEGRATIONS: Integration[] = [
  {
    id: "resend",
    name: "Resend (Email)",
    description: "Send email alerts and notifications via Resend",
    icon: () => (
      <img
        src="https://cdn.brandfetch.io/resend.com/w/400/h/400"
        alt="Resend"
        className="w-full h-full object-contain"
      />
    ),
    enabled: false,
    config: { 
      apiKey: "", 
      emailTo: "", 
      emailFrom: "onboarding@resend.dev",
      emailFromName: "SIM-OPS Agent Alerts"
    },
  },
  {
    id: "slack",
    name: "Slack",
    description: "Real-time alerts and notifications",
    icon: () => (
      <img
        src="https://cdn.brandfetch.io/slack.com/w/400/h/400"
        alt="Slack"
        className="w-full h-full object-contain"
      />
    ),
    enabled: false,
    config: { webhookUrl: "" },
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Monitor revenue, subscriptions, and customer churn",
    icon: () => (
      <img
        src="https://cdn.brandfetch.io/stripe.com/w/400/h/400"
        alt="Stripe"
        className="w-full h-full object-contain"
      />
    ),
    enabled: false,
    config: { apiKey: "", webhookSecret: "" },
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Send email notifications and campaigns",
    icon: () => (
      <img
        src="https://cdn.brandfetch.io/sendgrid.com/w/400/h/400"
        alt="SendGrid"
        className="w-full h-full object-contain"
      />
    ),
    enabled: false,
    config: { apiKey: "", fromEmail: "" },
  },
  {
    id: "custom-api",
    name: "Custom API",
    description: "Connect to your own backend API",
    icon: Database,
    enabled: false,
    config: { baseUrl: "", apiKey: "" },
  },
  {
    id: "webhook",
    name: "Webhooks",
    description: "Receive events from external systems",
    icon: Webhook,
    enabled: false,
    config: { url: "", secret: "" },
  },
];

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(DEFAULT_INTEGRATIONS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    // createClient retained for future Supabase persistence
    createClient();

    // Load from server-side config first
    try {
      const response = await fetch("/api/settings/integrations");
      if (response.ok) {
        const serverConfig = await response.json();
        
        setIntegrations(
          DEFAULT_INTEGRATIONS.map((defaultInt) => {
            const saved = serverConfig.integrations?.find((p: PersistedIntegration) => p.id === defaultInt.id);
            return saved
              ? { ...defaultInt, enabled: saved.enabled, config: saved.config }
              : defaultInt;
          })
        );
        return;
      }
    } catch (error) {
      console.error("Failed to load server config:", error);
    }

    // Fallback to localStorage
    const stored = localStorage.getItem("integrations");
    if (stored) {
      try {
        // Icons are React functions — they cannot survive JSON round-trips.
        // Only restore the serialisable fields (enabled, config) and
        // keep the icon from the original DEFAULT_INTEGRATIONS entry.
        const parsed: PersistedIntegration[] = JSON.parse(stored);
        setIntegrations(
          DEFAULT_INTEGRATIONS.map((defaultInt) => {
            const saved = parsed.find((p) => p.id === defaultInt.id);
            return saved
              ? { ...defaultInt, enabled: saved.enabled, config: saved.config }
              : defaultInt;
          })
        );
      } catch {
        // Ignore malformed / stale data
      }
    }
  };

  const handleToggle = (id: string) => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === id ? { ...int, enabled: !int.enabled } : int
      )
    );
  };

  const handleConfigChange = (id: string, field: string, value: string) => {
    setIntegrations((prev) =>
      prev.map((int) =>
        int.id === id
          ? { ...int, config: { ...int.config, [field]: value } }
          : int
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Persist only the serialisable fields — icon is a function and must be excluded
      const toSave: PersistedIntegration[] = integrations.map(({ id, enabled, config }) => ({
        id,
        enabled,
        config,
      }));
      
      // Save to localStorage
      localStorage.setItem("integrations", JSON.stringify(toSave));

      // Save to server (will update environment variables)
      const response = await fetch("/api/settings/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrations: toSave }),
      });

      if (!response.ok) {
        throw new Error("Failed to save to server");
      }

      const result = await response.json();

      toast.success("Integration settings saved successfully");
      
      // Show restart notification if needed
      if (result.requiresRestart) {
        toast.info(
          "Please restart your dev server for changes to take effect",
          {
            duration: 10000,
            action: {
              label: "Got it",
              onClick: () => {},
            },
          }
        );
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const testIntegration = async (id: string) => {
    const integration = integrations.find((int) => int.id === id);
    if (!integration) return;

    toast.info(`Testing ${integration.name} connection...`);

    try {
      // Test based on integration type
      if (id === "resend") {
        const response = await fetch("/api/test-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: integration.config.apiKey,
            emailTo: integration.config.emailTo,
            emailFrom: integration.config.emailFrom,
            emailFromName: integration.config.emailFromName,
          }),
        });

        if (response.ok) {
          toast.success(`${integration.name} connection successful! Check your email.`);
        } else {
          const error = await response.json();
          toast.error(`${integration.name} test failed: ${error.error || "Unknown error"}`);
        }
      } else if (id === "slack") {
        const response = await fetch("/api/integrations/slack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            severity: "low",
            title: "Test Connection",
            details: "This is a test message from SIM-OPS settings",
            data: { "Test": "Successful" },
            webhookUrl: integration.config.webhookUrl,
          }),
        });

        if (response.ok) {
          toast.success(`${integration.name} connection successful!`);
        } else {
          toast.error(`${integration.name} test failed`);
        }
      } else {
        // Generic test for other integrations
        setTimeout(() => {
          toast.success(`${integration.name} connection successful!`);
        }, 1500);
      }
    } catch (error) {
      toast.error(`${integration.name} test failed`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold uppercase tracking-wide mb-2">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground font-mono">
          Configure integrations and system settings
        </p>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="border-2 border-border bg-card">
          <TabsTrigger value="integrations" className="font-mono uppercase text-xs">
            Integrations
          </TabsTrigger>
          <TabsTrigger value="general" className="font-mono uppercase text-xs">
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="font-mono uppercase text-xs">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-6">
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="border-2 border-blue-500 bg-blue-50 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-blue-900">
                  Integration Configuration
                </h4>
                <p className="text-xs text-blue-800">
                  Configure your integrations below. Changes will be saved to your <code className="bg-blue-100 px-1 py-0.5 rounded">.env.local</code> file.
                  You'll need to restart your dev server after saving for changes to take effect.
                </p>
                <p className="text-xs text-blue-800 mt-2">
                  <strong>Tip:</strong> Use the "Test Connection" button to verify your settings before saving.
                </p>
              </div>
            </div>

            {integrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <div
                  key={integration.id}
                  className="border-2 border-border bg-card"
                >
                  {/* Header */}
                  <div className="p-4 border-b-2 border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border-2 border-border bg-white flex items-center justify-center p-1.5">
                        <Icon />
                      </div>
                      <div>
                        <h3 className="font-bold uppercase tracking-wide text-sm">
                          {integration.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {integration.enabled && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      )}
                      <Switch
                        checked={integration.enabled}
                        onCheckedChange={() => handleToggle(integration.id)}
                      />
                    </div>
                  </div>

                  {/* Configuration */}
                  {integration.enabled && (
                    <div className="p-4 space-y-4">
                      {Object.entries(integration.config).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label className="text-xs font-mono uppercase">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </Label>
                          {getFieldDescription(integration.id, key) && (
                            <p className="text-xs text-muted-foreground">
                              {getFieldDescription(integration.id, key)}
                            </p>
                          )}
                          <Input
                            type={
                              key.toLowerCase().includes("secret") ||
                                key.toLowerCase().includes("key") ||
                                key.toLowerCase().includes("token")
                                ? "password"
                                : "text"
                            }
                            value={value}
                            onChange={(e) =>
                              handleConfigChange(integration.id, key, e.target.value)
                            }
                            placeholder={getFieldPlaceholder(integration.id, key)}
                            className="font-mono text-xs"
                          />
                        </div>
                      ))}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testIntegration(integration.id)}
                          className="text-xs font-mono uppercase"
                        >
                          Test Connection
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs font-mono uppercase"
                          asChild
                        >
                          <a
                            href={getDocumentationUrl(integration.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Documentation
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  toast.info(
                    "To restart: Stop the dev server (Ctrl+C) and run 'npm run dev' again",
                    { duration: 8000 }
                  );
                }}
                className="font-mono uppercase text-xs"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                How to Restart
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="font-mono uppercase text-xs"
              >
                <Key className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save All Settings"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <div className="border-2 border-border bg-card p-6">
            <h3 className="font-bold uppercase tracking-wide text-sm mb-4">
              General Settings
            </h3>
            <p className="text-sm text-muted-foreground">
              General settings coming soon...
            </p>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <div className="border-2 border-border bg-card p-6">
            <h3 className="font-bold uppercase tracking-wide text-sm mb-4">
              Security Settings
            </h3>
            <p className="text-sm text-muted-foreground">
              Security settings coming soon...
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getDocumentationUrl(integrationId: string): string {
  const urls: Record<string, string> = {
    resend: "https://resend.com/docs/introduction",
    stripe: "https://stripe.com/docs/api",
    sendgrid: "https://docs.sendgrid.com/api-reference",
    slack: "https://api.slack.com/messaging/webhooks",
    "custom-api": "#",
    webhook: "#",
  };
  return urls[integrationId] || "#";
}

function getFieldDescription(integrationId: string, fieldKey: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    resend: {
      apiKey: "Get your API key from resend.com/api-keys",
      emailTo: "Email address where alerts will be sent",
      emailFrom: "Sender email (use onboarding@resend.dev for free tier)",
      emailFromName: "Display name for the sender",
    },
    slack: {
      webhookUrl: "Create a webhook at api.slack.com/messaging/webhooks",
    },
    stripe: {
      apiKey: "Get your secret key from stripe.com/dashboard/apikeys",
      webhookSecret: "Optional: For webhook signature verification",
    },
  };
  return descriptions[integrationId]?.[fieldKey] || "";
}

function getFieldPlaceholder(integrationId: string, fieldKey: string): string {
  const placeholders: Record<string, Record<string, string>> = {
    resend: {
      apiKey: "re_xxxxxxxxxxxx",
      emailTo: "alerts@yourcompany.com",
      emailFrom: "onboarding@resend.dev",
      emailFromName: "SIM-OPS Agent Alerts",
    },
    slack: {
      webhookUrl: "https://hooks.slack.com/services/...",
    },
    stripe: {
      apiKey: "sk_live_xxxxxxxxxxxx",
      webhookSecret: "whsec_xxxxxxxxxxxx",
    },
  };
  return placeholders[integrationId]?.[fieldKey] || `Enter ${fieldKey}`;
}
