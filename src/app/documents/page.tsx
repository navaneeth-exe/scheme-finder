"use client";

import { useEffect, useState, useRef } from "react";
import { useApp } from "@/lib/context";
import { getDocuments, addDocument, deleteDocument } from "@/lib/actions";
import type { Document } from "@/lib/types";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle, AlertTriangle, Trash2, Upload, Files, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const DOCUMENT_TYPES = [
  "Income Certificate", "Aadhaar Card", "Bonafide Certificate", "Mark Sheet",
  "Caste Certificate", "Bank Passbook", "Passport Photo", "PAN Card",
  "Residence Proof", "Voter ID", "Institution ID", "Farmer ID / Kisan Card",
  "Project Report", "Quotation",
];

export default function DocumentsPage() {
  const { userId } = useApp();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [docType, setDocType] = useState("");
  const [expiry, setExpiry] = useState("");
  const [adding, setAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function load() {
    if (!userId) { setLoading(false); return; }
    const docs = await getDocuments(userId);
    setDocuments(docs);
    setLoading(false);
  }

  useEffect(() => { load(); }, [userId]);

  async function handleAdd() {
    if (!userId || !docType || !selectedFile) return;
    setAdding(true);
    await addDocument({
      user_id: userId,
      document_type: docType,
      file_name: selectedFile.name,
      file_size: selectedFile.size,
      status: "Uploaded",
      expiry_date: expiry || undefined,
    });
    setShowAdd(false);
    setDocType("");
    setExpiry("");
    setSelectedFile(null);
    setAdding(false);
    load();
  }

  async function handleDelete(id: string) {
    await deleteDocument(id);
    load();
  }

  if (!userId) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <EmptyState icon={Files} title="Sign in to manage documents" description="Your documents are private and secure." actionLabel="Create Profile" actionHref="/onboarding" />
    </div>
  );

  if (loading) return <LoadingState message="Loading your documents…" />;

  const uploadedTypes = documents.map(d => d.document_type.toLowerCase());
  const commonDocs = DOCUMENT_TYPES.slice(0, 8);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-0.5">Document Vault</h1>
          <p className="text-sm text-muted-foreground">{documents.length} document{documents.length !== 1 ? "s" : ""} stored</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Upload className="h-4 w-4" /> Upload
        </button>
      </div>

      {/* Document Status Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {commonDocs.map(type => {
          const has = uploadedTypes.includes(type.toLowerCase());
          return (
            <div key={type} className={cn(
              "p-3 rounded-xl border text-center",
              has ? "bg-green-50 border-green-200" : "bg-muted/30"
            )}>
              {has ? <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" /> :
                <AlertTriangle className="h-5 w-5 text-muted-foreground mx-auto mb-1" />}
              <div className="text-xs font-medium leading-tight">{type}</div>
              <div className={`text-xs mt-0.5 ${has ? "text-green-700" : "text-muted-foreground"}`}>
                {has ? "Available" : "Missing"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Uploaded Documents */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Uploaded Documents</h2>
        {documents.length === 0 ? (
          <EmptyState icon={Files} title="No documents yet" description="Upload your documents here to track them across all your applications." actionLabel="Upload First Document" actionOnClick={() => setShowAdd(true)} />
        ) : (
          <div className="space-y-2">
            {documents.map(doc => {
              const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
              return (
                <div key={doc.id} className="flex items-center gap-4 p-4 bg-background border rounded-xl">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isExpired ? "bg-red-100" : "bg-green-100"}`}>
                    {isExpired ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{doc.document_type}</div>
                    <div className="text-xs text-muted-foreground truncate">{doc.file_name} • {(doc.file_size / 1024).toFixed(1)} KB</div>
                    {doc.expiry_date && (
                      <div className={`flex items-center gap-1 text-xs mt-0.5 ${isExpired ? "text-red-600" : "text-muted-foreground"}`}>
                        <Calendar className="h-3 w-3" />
                        {isExpired ? "Expired: " : "Expires: "}
                        {new Date(doc.expiry_date).toLocaleDateString("en-IN")}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDelete(doc.id)} className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-lg mb-4">Add Document</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Document Type</label>
                <select value={docType} onChange={e => setDocType(e.target.value)}
                  className="w-full h-11 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                  <option value="">Select type</option>
                  {DOCUMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Choose File</label>
                <input ref={fileRef} type="file" onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date (optional)</label>
                <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)}
                  className="w-full h-11 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 h-11 rounded-full border font-medium hover:bg-muted transition-colors text-sm">Cancel</button>
              <button onClick={handleAdd} disabled={!docType || !selectedFile || adding}
                className="flex-1 h-11 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm">
                {adding ? "Saving…" : "Save Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
