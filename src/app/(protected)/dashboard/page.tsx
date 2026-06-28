import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user.organizationId;

  if (!organizationId) {
    redirect("/login");
  }

  const [organization, documentCount, sopCount, queryCount] =
    await Promise.all([
      prisma.organization.findUnique({ where: { id: organizationId } }),
      prisma.document.count({ where: { organizationId } }),
      prisma.sOP.count({ where: { organizationId } }),
      prisma.query.count({ where: { organizationId } }),
    ]);

  const stats = [
    { label: "Total Documents", value: documentCount },
    { label: "Total SOPs", value: sopCount },
    { label: "Total Queries", value: queryCount },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome to Knowdesk</h1>
        <p className="text-muted-foreground">{organization?.name}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
