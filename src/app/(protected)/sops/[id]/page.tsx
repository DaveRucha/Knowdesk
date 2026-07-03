import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { authOptions } from "@/lib/auth";
import { withOrgContext } from "@/lib/prisma";

export default async function SopPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.organizationId) redirect("/register");

  const organizationId = session.user.organizationId;

  const sop = await withOrgContext(organizationId, (tx) =>
    tx.sOP.findFirst({
      where: { id: params.id, organizationId },
    })
  );

  return (
    <div className="flex flex-col min-h-screen">

      {/* Topbar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <Link
          href="/sops"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to SOPs
        </Link>
        {sop && (
          <>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-medium text-slate-700 truncate max-w-xs">{sop.title}</span>
          </>
        )}
      </div>

      <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
        {!sop ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <div className="text-sm font-semibold text-slate-700 mb-1">SOP not found</div>
            <div className="text-xs text-slate-400">This SOP may have been deleted or doesn&apos;t exist</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                  Standard Operating Procedure
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">{sop.title}</h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                Created {new Date(sop.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              <div className="prose prose-slate prose-sm max-w-none
                prose-headings:font-semibold prose-headings:text-slate-900
                prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                prose-p:text-slate-700 prose-p:leading-relaxed
                prose-li:text-slate-700
                prose-strong:text-slate-900 prose-strong:font-semibold
                prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:rounded
                prose-hr:border-slate-200
              ">
                <ReactMarkdown>{sop.content}</ReactMarkdown>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
