import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIM-OPS – Smart Intelligence Management",
  description:
    "Smart Intelligence Management for Operations Planning & Supervision",
  icons: {
    icon: "/simops-logo.png",
    apple: "/simops-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
