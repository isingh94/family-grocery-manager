"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  Home,
  ListChecks,
  LogOut,
  Sprout,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/shopping-list", label: "Shopping", icon: ListChecks },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/family", label: "Family", icon: Users },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Sprout className="size-5" />
          </span>
          <span>
            <span className="block text-base font-bold leading-tight">
              Family Grocery
            </span>
            <span className="block text-xs text-muted-foreground">
              Kitchen, pantry, errands
            </span>
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 lg:ml-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <Button
          className="w-full lg:ml-auto lg:w-auto"
          variant="outline"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </nav>
  );
}
