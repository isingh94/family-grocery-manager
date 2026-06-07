"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Mail, Sprout} from "lucide-react";
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

  async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (error) {
    setMessage(error.message);
  }
}

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
                Continue with Google or use an email magic link.
              </p>
            </div>

            <div className="space-y-3">
              
              <Button
               variant="outline"
                className="w-full"
                size="lg"
                onClick={signInWithGoogle}
                  >
                  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="18"
    height="18"
  >
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
    />
    <path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.7 15 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.4-8l-6.6 5.1C9.3 39.6 16.1 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3 5.2-5.9 6.6l6.2 5.2C39.9 36 44 30.6 44 24c0-1.3-.1-2.4-.4-3.5z"
    />
  </svg>
                <span className="ml-2">
                 Continue with Google</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>

                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

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
