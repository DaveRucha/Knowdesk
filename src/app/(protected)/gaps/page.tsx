"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GapItem {
  question: string;
  count: number;
  latest_asked: string;
  avg_confidence: number;
  is_resolved: boolean;
}

export default function GapsPage() {
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGaps = useCallback(async () => {
    try {
      const res = await fetch("/api/gaps");
      if (res.status === 403) {
        setError("You don't have permission to view this page.");
      } else if (!res.ok) {
        setError("Failed to load knowledge gaps.");
      } else {
        const data = await res.json();
        setGaps(data);
      }
    } catch {
      setError("Failed to load knowledge gaps.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGaps();
  }, [fetchGaps]);

  async function handleDismiss(question: string) {
    try {
      const res = await fetch("/api/gaps", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (res.ok) {
        setGaps((prev) => prev.filter((gap) => gap.question !== question));
      } else {
        setError("Failed to dismiss question.");
      }
    } catch {
      setError("Failed to dismiss question.");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Knowledge Gaps</h1>
        <p className="text-muted-foreground">
          Questions your team asked that Knowdesk couldn&apos;t answer
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <>
          <p className="text-sm text-muted-foreground">
            {gaps.length} unanswered{" "}
            {gaps.length === 1 ? "question" : "questions"} found
          </p>

          {gaps.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No gaps found. Your knowledge base is covering all questions!
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Times Asked</TableHead>
                      <TableHead>Last Asked</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gaps.map((gap) => (
                      <TableRow key={gap.question}>
                        <TableCell className="font-medium">
                          {gap.question}
                        </TableCell>
                        <TableCell>{gap.count}</TableCell>
                        <TableCell>
                          {new Date(gap.latest_asked).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                        </TableCell>
                        <TableCell>
                          {Math.round(gap.avg_confidence * 100)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {gap.is_resolved ? (
                            <Badge
                              variant="outline"
                              className="border-green-500 text-green-600"
                            >
                              Resolved
                            </Badge>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button asChild size="sm">
                                <Link
                                  href={`/sops/new?topic=${encodeURIComponent(gap.question)}`}
                                >
                                  Create SOP
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDismiss(gap.question)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
