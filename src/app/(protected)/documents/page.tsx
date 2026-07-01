"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Trash2, FileText, Clock, CheckCircle, XCircle, Lock, Globe } from "lucide-react";
import { useSession } from "next-auth/react";

type DocumentStatus = "PROCESSING" | "READY" | "FAILED";
type AccessLevel = "ALL" | "ADMIN_ONLY";

interface DocumentItem {
  id: string;
  name: string;
  status: DocumentStatus;
  accessLevel: AccessLevel;
  createdAt: string;
}

const STATUS_CONFIG: Record<DocumentStatus, { label: string; icon: React.ReactNode; classes: string }> = {
  PROCESSING: {
    label: "Processing",
    icon: <Clock className="w-3 h-3" />,
    classes: "bg-amber-50 text-amber-600 border border-amber-200",
  },
  READY: {
    label: "Ready",
    icon: <CheckCircle className="w-3 h-3" />,
    classes: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  },
  FAILED: {
    label: "Failed",
    icon: <XCircle className="w-3 h-3" />,
    classes: "bg-red-50 text-red-500 border border-red-200",
  },
};

export default function DocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [accessLevel, setAccessLevel] = useState<"ALL" | "ADMIN_ONLY">("ALL");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch {
      // ignore transient polling errors
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("accessLevel", accessLevel);
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (res.status === 202) {
        setMessage("Document uploaded! Processing will begin shortly.");
        setMessageType("success");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setMessage("Upload failed. Please try again.");
        setMessageType("error");
      }
    } catch {
      setMessage("Upload failed. Please try again.");
      setMessageType("error");
    } finally {
      setUploading(false);
      fetchDocuments();
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    fetchDocuments();
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* Topbar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Documents</h1>
        <p className="text-sm text-slate-500">Upload and manage your company knowledge base</p>
      </div>

      <div className="flex-1 p-8 space-y-6">

        {/* Upload card */}
        {isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Upload className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Upload Document</div>
              <div className="text-xs text-slate-500">PDF files only · max 50MB</div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Drop zone */}
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-slate-300" />
                <div className="text-sm text-slate-500">
                  {file ? (
                    <span className="text-indigo-600 font-medium">{file.name}</span>
                  ) : (
                    <>Click to choose a PDF <span className="text-slate-400">or drag and drop</span></>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {/* Access + upload button */}
            <div className="flex items-center gap-3">
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as "ALL" | "ADMIN_ONLY")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Visible to everyone</option>
                <option value="ADMIN_ONLY">Admin only</option>
              </select>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
            </div>

            {message && (
              <div className={`text-sm px-3 py-2 rounded-lg ${messageType === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                {message}
              </div>
            )}
          </div>
        </div>
        )}
        {/* Documents table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Your Documents</div>
            <div className="text-xs text-slate-400">{documents.length} {documents.length === 1 ? "document" : "documents"}</div>
          </div>

          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-sm font-medium text-slate-600 mb-1">No documents yet</div>
              <div className="text-xs text-slate-400">Upload a PDF to get started</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Access</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Uploaded</th>
                  {isAdmin && <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {documents.map((doc) => {
                  const status = STATUS_CONFIG[doc.status];
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-indigo-500" />
                          </div>
                          <span className="text-sm font-medium text-slate-800 truncate max-w-xs">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.classes}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${doc.accessLevel === "ADMIN_ONLY" ? "bg-violet-50 text-violet-600 border border-violet-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                          {doc.accessLevel === "ADMIN_ONLY" ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                          {doc.accessLevel === "ADMIN_ONLY" ? "Admin only" : "Everyone"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
