import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function SopPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!session.user.organizationId) {
    redirect("/register");
  }

  const sop = await prisma.sOP.findFirst({
    where: { id: params.id, organizationId: session.user.organizationId },
  });

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/sops">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to SOPs
        </Link>
      </Button>

      {!sop ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            SOP not found
          </CardContent>
        </Card>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold">{sop.title}</h1>
            <p className="text-muted-foreground">
              Created{" "}
              {new Date(sop.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="prose max-w-none">
                <ReactMarkdown>{sop.content}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
