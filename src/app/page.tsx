"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChevronRight,
  Circle,
  Mail,
  MessageSquare,
  PhoneCall,
  Ticket,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import logo from "../../public/simops-logo.png";
import "./landing.css";

export default function LandingPage() {
  const [riskBars, setRiskBars] = useState([72, 48, 89]);
  const [revenueAtRisk, setRevenueAtRisk] = useState(127400);

  useEffect(() => {
    const barTimer = setInterval(() => {
      setRiskBars((prev) =>
        prev.map((value) => {
          const jitter = Math.floor(Math.random() * 18) - 9;
          return Math.min(96, Math.max(22, value + jitter));
        }),
      );
    }, 1800);

    const revenueTimer = setInterval(() => {
      setRevenueAtRisk(
        (value) => value + Math.floor(Math.random() * 1200 + 350),
      );
    }, 950);

    return () => {
      clearInterval(barTimer);
      clearInterval(revenueTimer);
    };
  }, []);

  const formattedRevenue = useMemo(
    () => new Intl.NumberFormat("en-US").format(revenueAtRisk),
    [revenueAtRisk],
  );

  return (
    <div className="relative isolate min-h-screen bg-[#F4F6FB] text-foreground selection:bg-primary/20 flex flex-col">
      <div className="landing-bg-grid" />
      <header className="sticky top-0 z-50 border-b-2 border-border bg-card/95 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center">
              <Image src={logo} alt="SIM-OPS Logo" />
            </div>
            <span className="font-bold text-lg tracking-tight">SIM-OPS</span>
          </div>

          <nav className="ml-auto hidden items-center gap-6 md:flex">
            <Link
              href="#pipeline"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pipeline
            </Link>
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#access"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Access
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col">
        <section className="relative overflow-hidden px-6 pb-16 pt-20 md:pb-24 md:pt-28 border-b-2 border-border">
          <div className="pointer-events-none absolute right-0 top-0 h-[380px] w-[420px] rounded-full bg-primary/20 blur-[120px]" />

          <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-border bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
                Autonomous Agents Online
              </p>
              <h1 className="text-balance text-5xl font-extrabold leading-[1.05] md:text-7xl">
                Stop churn before it starts
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                SIM-OPS predicts customer churn in real time and triggers
                retention playbooks before risk turns into loss.
                <span className="mt-2 block text-muted-foreground">
                  Monitor telemetry, forecast outcomes, and let AI agents
                  execute across your stack.
                </span>
              </p>
              <div className="mt-8">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="h-12 border-0 bg-primary px-8 text-primary-foreground shadow-[0_0_36px_color-mix(in_oklab,var(--primary)_35%,transparent)] hover:bg-primary/90"
                  >
                    Launch Command Center
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="mockup">
                <div className="ambient" />
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Live Churn Radar
                    </p>
                    <div className="mt-4 space-y-3">
                      {riskBars.map((bar, idx) => (
                        <div key={idx}>
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{`Segment ${idx + 1}`}</span>
                            <span className="text-destructive">
                              {bar}% risk
                            </span>
                          </div>
                          <div className="risk-track">
                            <div
                              className="risk-bar"
                              style={{ width: `${bar}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="rounded-lg border-2 border-border bg-secondary p-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Agent Status
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="pip pulse" />
                        <span className="text-xs text-foreground">
                          Monitor: Active
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="pip pulse" />
                        <span className="text-xs text-foreground">
                          Predict: Active
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="pip inactive" />
                        <span className="text-xs text-muted-foreground">
                          Act: Standby
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg border-2 border-border bg-secondary p-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Revenue At Risk
                      </p>
                      <p className="revenue mt-2 text-destructive">
                        ${formattedRevenue}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        live telemetry stream
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="pipeline"
          className="border-b-2 border-border px-6 py-16 bg-card/40 scroll-mt-24"
        >
          <div className="mx-auto w-full max-w-7xl">
            <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">
              Autonomous Agent Pipeline
            </h2>
            <div className="pipeline overflow-x-auto pb-2">
              <div className="node group">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Monitor
                </p>
                <p className="details mt-2 text-sm text-muted-foreground">
                  Tracks telemetry and anomalies across all customers.
                </p>
              </div>
              <div className="connector hidden md:block">
                <span className="dot" />
              </div>
              <div className="node group">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Predict
                </p>
                <p className="details mt-2 text-sm text-muted-foreground">
                  Runs churn and CLV models to score customer risk.
                </p>
              </div>
              <div className="connector hidden md:block">
                <span className="dot" />
              </div>
              <div className="node group">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Decide
                </p>
                <p className="details mt-2 text-sm text-muted-foreground">
                  Selects best retention strategy per account context.
                </p>
              </div>
              <div className="connector hidden md:block">
                <span className="dot" />
              </div>
              <div className="node group">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Act
                </p>
                <p className="details mt-2 text-sm text-muted-foreground">
                  Executes workflows across alerts, tickets, and outreach.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-6 py-16 scroll-mt-24">
          <div className="mx-auto w-full max-w-7xl">
            <h2 className="mb-8 text-2xl font-bold md:text-3xl">
              Built For High-Risk Retention Ops
            </h2>
            <div className="bento">
              <div className="big">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Model Confidence
                </p>
                <div className="mt-4 flex items-end gap-3">
                  <p className="text-6xl font-extrabold md:text-7xl">&gt;85%</p>
                  <p className="mb-2 text-muted-foreground">
                    churn prediction accuracy on benchmark datasets
                  </p>
                </div>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                  Powered by Random Forest and anomaly detection tuned for SaaS
                  customer behavior signals.
                </p>
              </div>
              <div className="rounded-xl border-2 border-border bg-card p-5">
                <p className="mb-3 text-sm font-semibold">Integrations</p>
                <div className="chips">
                  <span className="chip">
                    <MessageSquare className="h-4 w-4" /> Slack
                  </span>
                  <span className="chip">
                    <Ticket className="h-4 w-4" /> Jira
                  </span>
                  <span className="chip">
                    <Mail className="h-4 w-4" /> Email
                  </span>
                  <span className="chip">
                    <PhoneCall className="h-4 w-4" /> Twilio
                  </span>
                </div>
              </div>
              <div className="rounded-xl border-2 border-border bg-card p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Risk Indicators
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Danger states are highlighted with{" "}
                  <span className="font-semibold text-destructive">
                    destructive
                  </span>{" "}
                  to surface churn escalation instantly.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer
        id="access"
        className="relative z-10 footer-cta border-t-2 border-border bg-card scroll-mt-24"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            Ready to prevent churn before it starts?
          </p>
          <Button className="border-0 bg-primary text-primary-foreground hover:bg-primary/90">
            Request Access
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
