"use client";

import { Activity, Building2, Settings, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AcmeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      {/* SIM-OPS context banner */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-600 text-white text-xs py-2 px-4 text-center font-medium">
        🤖 This is a <strong>simulated business dashboard</strong> — SIM-OPS
        monitors this data autonomously.{" "}
        <Link href="/" className="underline hover:text-blue-200 ml-1">
          View SIM-OPS agent dashboard →
        </Link>
      </div>

      {/* Acme Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Acme SaaS
              </span>
            </div>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/acme-corp"
                className="text-gray-600 hover:text-blue-600 font-medium text-sm flex items-center gap-1"
              >
                <Activity className="w-4 h-4" /> Overview
              </Link>
              <Link
                href="/acme-corp"
                className="text-gray-500 hover:text-gray-900 font-medium text-sm flex items-center gap-1"
              >
                <Users className="w-4 h-4" /> Customers
              </Link>
              <Link
                href="/settings"
                className="text-gray-500 hover:text-gray-900 font-medium text-sm flex items-center gap-1"
              >
                <Settings className="w-4 h-4" /> Settings
              </Link>
            </nav>

            {/* Right side: SIM-OPS link + avatar */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors"
              >
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Switch to SIM-OPS</span>
                <span className="text-blue-600 font-bold">↗</span>
              </Link>

              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
