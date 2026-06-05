"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Boxes, ListChecks, Plus, Users } from "lucide-react";

import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentFamilyId } from "@/lib/helpers/getFamily";
import { supabase } from "@/lib/supabase/client";

const stats = [
  {
    label: "Shopping Items",
    key: "shopping",
    icon: ListChecks,
    tone: "bg-primary/10 text-primary",
  },
  {
    label: "Inventory Items",
    key: "inventory",
    icon: Boxes,
    tone: "bg-accent text-accent-foreground",
  },
  {
    label: "Active Family",
    key: "family",
    icon: Users,
    tone: "bg-secondary text-secondary-foreground",
  },
] as const;

export default function DashboardPage() {
  const [shoppingCount, setShoppingCount] = useState(0);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [familyCount, setFamilyCount] = useState(0);
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setEmail(user.email || "");

      const familyId = await getCurrentFamilyId();

      if (!familyId) return;

      const { count: shopping } = await supabase
        .from("shopping_list")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("family_id", familyId);

      const { count: inventory } = await supabase
        .from("inventory")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("family_id", familyId);

      setShoppingCount(shopping || 0);
      setInventoryCount(inventory || 0);
      setFamilyCount(1);
    }

    loadUser();
  }, []);

  const values = {
    shopping: shoppingCount,
    inventory: inventoryCount,
    family: familyCount,
  };

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-stretch">
          <div className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
            <Badge variant="secondary">Today at home</Badge>
            <div className="mt-4 max-w-2xl space-y-3">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Family Grocery Manager
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Logged in as {email || "your account"}. Plan what to buy, track
                what is stocked, and keep the household aligned.
              </p>
            </div>
          </div>

          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div>
                <div className="text-sm opacity-80">Quick action</div>
                <div className="mt-2 text-2xl font-bold">Add groceries</div>
              </div>
              <Button asChild className="mt-8" variant="secondary">
                <Link href="/shopping-list">
                  <Plus className="size-4" />
                  Open Shopping List
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.key}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>{stat.label}</CardTitle>
                  <span
                    className={`flex size-9 items-center justify-center rounded-lg ${stat.tone}`}
                  >
                    <Icon className="size-5" />
                  </span>
                </CardHeader>

                <CardContent>
                  <div className="text-4xl font-bold">{values[stat.key]}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Current household count
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold">Pantry health</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Inventory items marked low can be sent back to the shopping
                list automatically when they run out.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/inventory">Review Inventory</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold">Family setup</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Create or update the household profile that connects your
                shopping and inventory data.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/family">Manage Family</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
