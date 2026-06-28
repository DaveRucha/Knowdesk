import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SopsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!session.user.organizationId) {
    redirect("/register");
  }

  const sops = await prisma.sOP.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });

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

      {sops.length === 0 ? (
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
                <Button asChild variant="outline" size="sm">
                  <Link href={`/sops/${sop.id}`}>View</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
