"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Mail, Sprout } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push("/dashboard");
      }
    }

    checkSession();
  }, [router]);

  async function handleLogin() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link.");
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm">
            <Sprout className="size-4 text-primary" />
            Shared grocery planning for busy homes
          </div>

          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Family Grocery Manager
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              Keep the shopping list, pantry stock, and family setup in one tidy
              place.
            </p>
          </div>

          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {["Plan", "Shop", "Restock"].map((step) => (
              <div
                key={step}
                className="rounded-lg border border-border/70 bg-card/80 p-4 shadow-sm"
              >
                <div className="text-sm font-semibold">{step}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  A simple flow for everyday grocery runs.
                </div>
              </div>
            ))}
          </div>
        </section>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="mb-6 space-y-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Mail className="size-5" />
              </div>
              <h2 className="text-2xl font-bold">Sign in</h2>
              <p className="text-sm text-muted-foreground">
                Enter your email and we will send a magic link.
              </p>
            </div>

            <div className="space-y-3">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                className="w-full"
                disabled={loading}
                size="lg"
                onClick={handleLogin}
              >
                {loading ? "Sending..." : "Send login link"}
                <ArrowRight className="size-4" />
              </Button>
            </div>

            {message && (
              <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
