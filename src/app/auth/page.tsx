"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      logger.info("User signed in", { email });
      toast.success("Welcome back!");
      router.push("/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to sign in";
      logger.error("Sign in failed", { error: message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          // Skip email confirmation for development
          data: {
            email_confirmed: true,
          },
        },
      });

      if (error) throw error;

      logger.info("User signed up", { email });
      
      // Check if email confirmation is required
      if (data?.user && !data.session) {
        toast.success("Check your email to confirm your account!");
      } else {
        toast.success("Account created! You can now sign in.");
        // Auto-switch to sign in tab
        setTimeout(() => {
          const signInTab = document.querySelector('[value="signin"]') as HTMLButtonElement;
          signInTab?.click();
        }, 1500);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to sign up";
      logger.error("Sign up failed", { error: message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 flex items-center justify-center">
              <Image
                src="/simops-logo.png"
                alt="SIM-OPS Logo"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold uppercase tracking-wider">
              SIM-OPS
            </CardTitle>
            <CardDescription className="text-xs font-mono tracking-wide">
              Smart Intelligence Management for Operations Planning &
              Supervision
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-auto p-0 bg-transparent gap-2">
              <TabsTrigger
                value="signin"
                className="border-2 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:border-foreground text-xs font-mono uppercase tracking-wider py-2"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="border-2 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:border-foreground text-xs font-mono uppercase tracking-wider py-2"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="signin-email"
                    className="text-xs font-mono uppercase tracking-wider"
                  >
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="operator@sim-ops.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="signin-password"
                    className="text-xs font-mono uppercase tracking-wider"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-2 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full border-2 text-xs font-mono uppercase tracking-wider"
                  disabled={isLoading}
                >
                  {isLoading ? "Authenticating..." : "Access System"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="signup-email"
                    className="text-xs font-mono uppercase tracking-wider"
                  >
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="operator@sim-ops.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="signup-password"
                    className="text-xs font-mono uppercase tracking-wider"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="border-2 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full border-2 text-xs font-mono uppercase tracking-wider"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Register Operator"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
