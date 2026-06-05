"use client";

import { useEffect, useState } from "react";
import { Boxes, Minus, PackageX, Trash2, TriangleAlert } from "lucide-react";

import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentFamilyId } from "@/lib/helpers/getFamily";
import { supabase } from "@/lib/supabase/client";

type InventoryItem = {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
};

type InventoryFilter = "all" | "low" | "none";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState("");

  async function consumeItem(id: string, currentQty: number) {
    const newQty = Math.max(0, currentQty - 1);

    await supabase
      .from("inventory")
      .update({
        quantity: newQty,
      })
      .eq("id", id);

    if (newQty === 0) {
      const familyId = await getCurrentFamilyId();
      const currentItem = items.find((i) => i.id === id);

      if (familyId && currentItem) {
        const { data: existing } = await supabase
          .from("shopping_list")
          .select("id")
          .eq("family_id", familyId)
          .eq("item_name", currentItem.item_name)
          .eq("unit", currentItem.unit)
          .eq("status", "pending");

        if (!existing || existing.length === 0) {
          await supabase.from("shopping_list").insert({
            family_id: familyId,
            item_name: currentItem.item_name,
            quantity: 1,
            unit: currentItem.unit,
            status: "pending",
            source: "system",
          });
        }
      }
    }

    loadInventory();
  }

  async function loadInventory() {
    const familyId = await getCurrentFamilyId();

    if (!familyId) return;

    const { data } = await supabase
      .from("inventory")
      .select("*")
      .eq("family_id", familyId)
      .order("item_name");

    setItems(data || []);
  }

  async function deleteInventoryItem(item: InventoryItem) {
    if (Number(item.quantity) !== 0) {
      setMessage("Only no-stock inventory items can be deleted.");
      return;
    }

    setDeletingId(item.id);
    setMessage("");

    const { data, error } = await supabase
      .from("inventory")
      .delete()
      .eq("id", item.id)
      .select("id");

    setDeletingId("");

    if (error) {
      setMessage(`Could not delete ${item.item_name}: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      setMessage(
        `Could not delete ${item.item_name}. The database did not return a deleted row.`
      );
      return;
    }

    setItems((currentItems) =>
      currentItems.filter((currentItem) => currentItem.id !== item.id)
    );
    setMessage(`${item.item_name} deleted from inventory.`);
    loadInventory();
  }

  useEffect(() => {
    loadInventory();
  }, []);

  const lowStockItems = items.filter(
    (item) => Number(item.quantity) > 0 && Number(item.quantity) <= 1
  );
  const noStockItems = items.filter((item) => Number(item.quantity) === 0);
  const filteredItems = items.filter((item) => {
    if (filter === "low") {
      return Number(item.quantity) > 0 && Number(item.quantity) <= 1;
    }

    if (filter === "none") {
      return Number(item.quantity) === 0;
    }

    return true;
  });

  const filterCards = [
    {
      key: "all",
      label: "Total",
      value: items.length,
      icon: Boxes,
      className: "bg-primary/10 text-primary",
    },
    {
      key: "low",
      label: "Low stock",
      value: lowStockItems.length,
      icon: TriangleAlert,
      className: "bg-accent text-accent-foreground",
    },
    {
      key: "none",
      label: "No stock",
      value: noStockItems.length,
      icon: PackageX,
      className: "bg-destructive/10 text-destructive",
    },
  ] as const;

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge variant="secondary">Pantry tracker</Badge>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Inventory
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Track what is stocked, low, or finished. Click a summary card
                  to filter the inventory below.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[30rem]">
              {filterCards.map((item) => {
                const Icon = item.icon;
                const isActive = filter === item.key;

                return (
                  <button
                    key={item.key}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      isActive
                        ? "border-primary bg-card shadow-md"
                        : "border-transparent bg-muted/80 hover:border-border"
                    }`}
                    onClick={() => setFilter(item.key)}
                    type="button"
                  >
                    <span
                      className={`mb-3 flex size-8 items-center justify-center rounded-lg ${item.className}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="text-2xl font-bold">{item.value}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {message && (
          <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            {message}
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const quantity = Number(item.quantity);
            const isNoStock = quantity === 0;
            const isLowStock = quantity > 0 && quantity <= 1;

            return (
              <Card key={item.id}>
                <CardContent className="flex h-full flex-col justify-between p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold leading-tight">
                          {item.item_name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.quantity} {item.unit} available
                        </p>
                      </div>

                      {isNoStock ? (
                        <Badge variant="destructive">No Stock</Badge>
                      ) : isLowStock ? (
                        <Badge variant="secondary">Low Stock</Badge>
                      ) : (
                        <Badge variant="outline">In Stock</Badge>
                      )}
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${
                          isNoStock
                            ? "bg-destructive"
                            : isLowStock
                              ? "bg-accent"
                              : "bg-primary"
                        }`}
                        style={{
                          width: `${Math.min(100, quantity * 20)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="w-full"
                      disabled={isNoStock}
                      onClick={() => consumeItem(item.id, quantity)}
                    >
                      <Minus className="size-4" />
                      1 Used
                    </Button>

                    {isNoStock && (
                      <Button
                        className="w-full"
                        variant="destructive"
                        disabled={deletingId === item.id}
                        onClick={() => deleteInventoryItem(item)}
                      >
                        <Trash2 className="size-4" />
                        {deletingId === item.id ? "Deleting..." : "Delete"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <Boxes className="size-10 text-muted-foreground" />
              <div>
                <h2 className="font-semibold">No matching inventory</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Change the filter above to see another stock group.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
