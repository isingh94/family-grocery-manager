"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ListChecks,
  Minus,
  Plus,
  ShoppingBasket,
  Trash2,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentFamilyId } from "@/lib/helpers/getFamily";
import { supabase } from "@/lib/supabase/client";

type ShoppingItem = {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  status: string;
  source?: string;
};

type ShoppingFilter = "all" | "pending" | "purchased";

const unitOptions = ["pcs", "packet", "kg", "gms", "ltr", "ml", "dozen"];

const commonItems = [
  { name: "Milk", unit: "ltr" },
  { name: "Tea", unit: "packet" },
  { name: "Sugar", unit: "kg" },
  { name: "Rice", unit: "kg" },
  { name: "Atta", unit: "kg" },
  { name: "Dal", unit: "kg" },
  { name: "Oil", unit: "ltr" },
  { name: "Salt", unit: "packet" },
  { name: "Curd", unit: "packet" },
  { name: "Bread", unit: "packet" },
  { name: "Eggs", unit: "dozen" },
  { name: "Onion", unit: "kg" },
  { name: "Potato", unit: "kg" },
  { name: "Tomato", unit: "kg" },
  { name: "Banana", unit: "dozen" },
  { name: "Coriander", unit: "pcs" },
];

const commonBrands = [
  "Amul",
  "Tata",
  "Aashirvaad",
  "Fortune",
  "Mother Dairy",
  "Nandini",
  "Nestle",
  "Red Label",
  "Taj Mahal",
  "Brooke Bond",
  "Daawat",
  "India Gate",
  "Surf Excel",
  "Parle",
  "Britannia",
];

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export default function ShoppingListPage() {
  const [itemName, setItemName] = useState("");
  const [brand, setBrand] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pcs");
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [filter, setFilter] = useState<ShoppingFilter>("all");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState("");

  async function loadItems() {
    const familyId = await getCurrentFamilyId();

    if (!familyId) {
      setItems([]);
      return;
    }

    const { data } = await supabase
      .from("shopping_list")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false });

    const loadedItems = data || [];
    const pendingGroups = loadedItems.reduce<Record<string, ShoppingItem[]>>(
      (groups, item) => {
        if (item.status !== "pending") return groups;

        const key = `${normalizeName(item.item_name).toLowerCase()}::${item.unit}`;
        groups[key] = [...(groups[key] || []), item];
        return groups;
      },
      {}
    );

    const duplicateGroups = Object.values(pendingGroups).filter(
      (group) => group.length > 1
    );

    if (duplicateGroups.length > 0) {
      await Promise.all(
        duplicateGroups.map(async (group) => {
          const [primary, ...duplicates] = group;
          const totalQuantity = group.reduce(
            (sum, item) => sum + Number(item.quantity),
            0
          );

          await supabase
            .from("shopping_list")
            .update({
              item_name: normalizeName(primary.item_name),
              quantity: totalQuantity,
            })
            .eq("id", primary.id);

          await supabase
            .from("shopping_list")
            .delete()
            .in(
              "id",
              duplicates.map((item) => item.id)
            );
        })
      );

      const { data: mergedData } = await supabase
        .from("shopping_list")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false });

      setItems(mergedData || []);
      return;
    }

    setItems(loadedItems);
  }

  async function addItem(
    name = itemName,
    selectedUnit = unit,
    amount = quantity,
    selectedBrand = brand
  ) {
    const cleanName = normalizeName(name);
    const cleanBrand = normalizeName(selectedBrand);
    const itemWithBrand = cleanBrand
      ? `${cleanBrand} ${cleanName}`
      : cleanName;

    if (!cleanName) return;

    const familyId = await getCurrentFamilyId();
    if (!familyId) return;

    const numericQuantity = Math.max(1, Number(amount) || 1);

    const { data: existing } = await supabase
      .from("shopping_list")
      .select("id, quantity")
      .eq("family_id", familyId)
      .eq("item_name", itemWithBrand)
      .eq("unit", selectedUnit)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("shopping_list")
        .update({
          quantity: Number(existing.quantity) + numericQuantity,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("shopping_list").insert({
        family_id: familyId,
        item_name: itemWithBrand,
        quantity: numericQuantity,
        unit: selectedUnit,
        status: "pending",
      });
    }

    setItemName("");
    setBrand("");
    setQuantity("1");
    setUnit("pcs");
    setFilter("pending");
    loadItems();
  }

  async function updateQuantity(item: ShoppingItem, nextQuantity: number) {
    if (item.status !== "pending") return;

    await supabase
      .from("shopping_list")
      .update({
        quantity: Math.max(1, nextQuantity),
      })
      .eq("id", item.id);

    loadItems();
  }

  async function markBought(
    id: string,
    itemName: string,
    quantity: number,
    unit: string
  ) {
    await supabase
      .from("shopping_list")
      .update({
        status: "bought",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    const familyId = await getCurrentFamilyId();

    const { data: existing } = await supabase
      .from("inventory")
      .select("*")
      .eq("family_id", familyId)
      .eq("item_name", itemName)
      .eq("unit", unit)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("inventory")
        .update({
          quantity: Number(existing.quantity) + Number(quantity),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("inventory").insert({
        family_id: familyId,
        item_name: itemName,
        quantity,
        unit,
      });
    }

    loadItems();
  }

  async function deleteItem(item: ShoppingItem) {
    setDeletingId(item.id);
    setMessage("");

    const { data, error } = await supabase
      .from("shopping_list")
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
    setMessage(`${item.item_name} deleted from shopping list.`);
    loadItems();
  }

  useEffect(() => {
    loadItems();
  }, []);

  const pendingItems = items.filter((item) => item.status === "pending");
  const purchasedItems = items.filter((item) => item.status !== "pending");
  const filteredItems = items.filter((item) => {
    if (filter === "pending") return item.status === "pending";
    if (filter === "purchased") return item.status !== "pending";
    return true;
  });
  const itemSuggestions = commonItems
    .filter((item) =>
      item.name.toLowerCase().includes(itemName.trim().toLowerCase())
    )
    .slice(0, 8);
  const brandSuggestions = commonBrands
    .filter((item) => item.toLowerCase().includes(brand.trim().toLowerCase()))
    .slice(0, 8);

  const filterCards = [
    {
      key: "all",
      label: "All",
      value: items.length,
      className: "bg-primary/10 text-primary",
    },
    {
      key: "pending",
      label: "Pending",
      value: pendingItems.length,
      className: "bg-accent text-accent-foreground",
    },
    {
      key: "purchased",
      label: "Purchased",
      value: purchasedItems.length,
      className: "bg-muted text-muted-foreground",
    },
  ] as const;

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge variant="secondary">Grocery run</Badge>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Shopping List
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Add staples quickly, adjust pending quantities, and avoid
                  duplicate Milk, Tea, or Sugar entries.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[28rem]">
              {filterCards.map((item) => {
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
                      <ShoppingBasket className="size-4" />
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

        <Card className="mt-6">
          <CardContent className="space-y-5 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_150px_120px_auto]">
              <div className="space-y-2">
                <Input
                  list="shopping-item-suggestions"
                  placeholder="Item name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
                <datalist id="shopping-item-suggestions">
                  {commonItems.map((item) => (
                    <option key={item.name} value={item.name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Input
                  list="shopping-brand-suggestions"
                  placeholder="Brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
                <datalist id="shopping-brand-suggestions">
                  {commonBrands.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>

              <Input
                aria-label="Quantity"
                min="1"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />

              <Button
                className="w-full md:w-auto"
                disabled={!itemName.trim()}
                onClick={() => addItem()}
              >
                <Plus className="size-4" />
                Add Item
              </Button>
            </div>

            {(itemName.trim() || brand.trim()) && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-sm font-medium">
                    Matching items
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {itemSuggestions.map((item) => (
                      <button
                        key={item.name}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/10"
                        onClick={() => {
                          setItemName(item.name);
                          setUnit(item.unit);
                        }}
                        type="button"
                      >
                        {item.name}
                        <span className="ml-1 text-muted-foreground">
                          ({item.unit})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-sm font-medium">
                    Matching brands
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {brandSuggestions.map((item) => (
                      <button
                        key={item}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/10"
                        onClick={() => setBrand(item)}
                        type="button"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 text-sm font-medium">Unit</div>
              <div className="flex flex-wrap gap-2">
                {unitOptions.map((option) => (
                  <button
                    key={option}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      unit === option
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                    onClick={() => setUnit(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Common Indian staples</div>
              <div className="flex flex-wrap gap-2">
                {commonItems.map((item) => (
                  <button
                    key={`${item.name}-${item.unit}`}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:bg-primary/10"
                    onClick={() => addItem(item.name, item.unit, "1")}
                    type="button"
                  >
                    {item.name}
                    <span className="ml-1 text-muted-foreground">
                      ({item.unit})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {message && (
          <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            {message}
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const isPending = item.status === "pending";

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
                          Quantity: {item.quantity} {item.unit}
                        </p>
                      </div>

                      <Badge variant={isPending ? "default" : "secondary"}>
                        {isPending ? "Pending" : "Purchased"}
                      </Badge>
                    </div>

                    {item.source === "system" && (
                      <Badge variant="outline">Auto-added from inventory</Badge>
                    )}

                    {isPending && (
                      <div className="flex items-center justify-between rounded-lg bg-muted p-2">
                        <span className="text-sm font-medium">Quantity</span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item, Number(item.quantity) - 1)
                            }
                          >
                            <Minus className="size-4" />
                          </Button>
                          <span className="min-w-8 text-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item, Number(item.quantity) + 1)
                            }
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    {isPending && (
                      <Button
                        className="w-full"
                        onClick={() =>
                          markBought(
                            item.id,
                            item.item_name,
                            item.quantity,
                            item.unit
                          )
                        }
                      >
                        <Check className="size-4" />
                        Bought
                      </Button>
                    )}

                    <Button
                      className="w-full"
                      variant="destructive"
                      disabled={deletingId === item.id}
                      onClick={() => deleteItem(item)}
                    >
                      <Trash2 className="size-4" />
                      {deletingId === item.id
                        ? "Deleting..."
                        : isPending
                          ? "Delete Pending"
                          : "Delete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <ListChecks className="size-10 text-muted-foreground" />
              <div>
                <h2 className="font-semibold">No matching shopping items</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a staple above or change the selected filter.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
