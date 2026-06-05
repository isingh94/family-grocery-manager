"use client";

import { useEffect, useState } from "react";
import { Crown, Home, Mail, User, Users } from "lucide-react";

import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";

type Family = {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string;
};

type FamilyMember = {
  id?: string;
  family_id?: string;
  user_id?: string;
  email?: string;
  role?: string;
  created_at?: string;
};

export default function FamilyPage() {
  const [familyName, setFamilyName] = useState("");
  const [message, setMessage] = useState("");
  const [families, setFamilies] = useState<Family[]>([]);
  const [membersByFamily, setMembersByFamily] = useState<
    Record<string, FamilyMember[]>
  >({});
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");

  async function loadFamilies() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Not logged in");
      return;
    }

    setCurrentUserId(user.id);
    setCurrentEmail(user.email || "");

    const { data } = await supabase
      .from("families")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    const loadedFamilies = data || [];
    setFamilies(loadedFamilies);

    const nextMembers: Record<string, FamilyMember[]> = {};

    await Promise.all(
      loadedFamilies.map(async (family) => {
        const { data: members } = await supabase
          .from("family_members")
          .select("*")
          .eq("family_id", family.id);

        nextMembers[family.id] = members || [];
      })
    );

    setMembersByFamily(nextMembers);
  }

  async function createFamily() {
    const cleanName = familyName.trim();

    if (!cleanName) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Not logged in");
      return;
    }

    const { error } = await supabase.from("families").insert({
      name: cleanName,
      owner_id: user.id,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setFamilyName("");
    setMessage("Family created successfully");
    loadFamilies();
  }

  useEffect(() => {
    loadFamilies();
  }, []);

  return (
    <>
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
          <Badge variant="secondary">Household profile</Badge>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Family</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Create households and review who owns or belongs to each one.
              </p>
            </div>

            <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-6" />
            </span>
          </div>
        </section>

        <Card className="mt-6">
          <CardContent className="p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="family-name">
                  Family name
                </label>
                <Input
                  id="family-name"
                  placeholder="The Sharma household"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                />
              </div>

              <Button
                className="self-end"
                disabled={!familyName.trim()}
                onClick={createFamily}
              >
                <Home className="size-4" />
                Create
              </Button>
            </div>

            {message && (
              <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </CardContent>
        </Card>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          {families.map((family) => {
            const members = membersByFamily[family.id] || [];
            const ownerIsCurrentUser = family.owner_id === currentUserId;

            return (
              <Card key={family.id}>
                <CardContent className="space-y-5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold">{family.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Created by {ownerIsCurrentUser ? "you" : family.owner_id}
                      </p>
                    </div>

                    <Badge variant={ownerIsCurrentUser ? "default" : "outline"}>
                      <Crown className="size-3" />
                      Owner
                    </Badge>
                  </div>

                  <div className="rounded-lg bg-primary/10 p-4 text-primary">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Mail className="size-4" />
                      Owner account
                    </div>
                    <div className="mt-1 text-sm">
                      {ownerIsCurrentUser && currentEmail
                        ? currentEmail
                        : family.owner_id}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">Members</h3>
                      <Badge variant="secondary">
                        {members.length + (ownerIsCurrentUser ? 1 : 0)}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {ownerIsCurrentUser && (
                        <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                              <User className="size-4" />
                            </span>
                            <div>
                              <div className="text-sm font-medium">
                                {currentEmail || "Current user"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Owner
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {members.map((member, index) => (
                        <div
                          key={member.id || `${family.id}-${index}`}
                          className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                              <User className="size-4" />
                            </span>
                            <div>
                              <div className="text-sm font-medium">
                                {member.email || member.user_id || "Member"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {member.role || "Member"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {members.length === 0 && !ownerIsCurrentUser && (
                        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                          No members found for this family yet.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {families.length === 0 && (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <Users className="size-10 text-muted-foreground" />
              <div>
                <h2 className="font-semibold">No families created yet</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a family above to start sharing grocery data.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
