import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bot, LineChart, ShieldCheck, ArrowRight, Github } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 selection:bg-indigo-500/30 flex flex-col">
      <header className="px-6 py-6 border-b border-white/5 flex items-center justify-between sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center">
            <Bot className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">SIM-OPS</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="https://github.com/yourusername/sim-ops" target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/10 hidden sm:flex">
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" className="bg-indigo-500 hover:bg-indigo-400 text-white border-0">
              Live Demo
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative px-6 py-24 md:py-32 flex flex-col items-center text-center overflow-hidden">
          {/* Background effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              v0.1.0 — Autonomous Agents Online
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
              Stop Churn Before <br className="hidden md:block" /> It Happens.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Autonomous AI that predicts churn, forecasts revenue, and executes retention workflows before it's too late. 
              <span className="text-slate-300 font-medium block mt-2"> Smart Intelligence Management for Operations Planning & Supervision.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-400 text-white font-medium px-8 h-12">
                  Launch Demo <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="https://github.com/yourusername/sim-ops" target="_blank" rel="noreferrer">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 hover:text-white">
                  <Github className="mr-2 w-4 h-4" /> View Source
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="px-6 py-24 bg-slate-900/50 border-t border-white/5 relative z-10 flex-1">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div className="bg-slate-800/40 border border-white/5 p-8 rounded-2xl flex flex-col gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <LineChart className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">ML-Powered Predictions</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Accurate forecasting for customer churn and lifetime value. 
                  Identify at-risk accounts early using Random Forest models.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-800/40 border border-white/5 p-8 rounded-2xl flex flex-col gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Multi-Agent System</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  A pipeline of AI agents that analyze behavior, evaluate decisions, 
                  and act autonomously using LLM orchestration.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-800/40 border border-white/5 p-8 rounded-2xl flex flex-col gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Automated Retention</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Instantly execute retention workflows (Slack, Jira, Email, Twilio Voice) 
                  when thresholds are breached.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>
      
      <footer className="py-8 text-center text-slate-500 text-sm border-t border-white/5">
        <p>SIM-OPS &copy; {new Date().getFullYear()}. Built for modern operations.</p>
      </footer>
    </div>
  );
}
