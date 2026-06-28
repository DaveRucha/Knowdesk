"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SopItem {
  id: string;
  title: string;
  createdAt: string;
}

export default function SopsPage() {
  const [sops, setSops] = useState<SopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSops = useCallback(async () => {
    try {
      const res = await fetch("/api/sops");
      if (res.ok) {
        const data = await res.json();
        setSops(data);
      } else {
        setError("Failed to load SOPs.");
      }
    } catch {
      setError("Failed to load SOPs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSops();
  }, [fetchSops]);

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this SOP?")) return;

    try {
      const res = await fetch(`/api/sops/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSops((prev) => prev.filter((sop) => sop.id !== id));
      } else {
        setError("Failed to delete SOP.");
      }
    } catch {
      setError("Failed to delete SOP.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SOPs</h1>
          <p className="text-muted-foreground">
            Your organization&apos;s standard operating procedures
          </p>
        </div>
        <Button asChild>
          <Link href="/sops/new">
            <Plus className="mr-2 h-4 w-4" />
            Create New SOP
          </Link>
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && sops.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No SOPs yet. Create your first SOP to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sops.map((sop) => (
            <Card key={sop.id}>
              <CardHeader>
                <CardTitle className="text-lg">{sop.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {new Date(sop.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/sops/${sop.id}`}>View</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(sop.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
