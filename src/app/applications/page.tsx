"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { getApplications } from "@/lib/actions";
import type { Application } from "@/lib/types";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { FileCheck, CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Ready: "bg-blue-100 text-blue-800",
  Submitted: "bg-indigo-100 text-indigo-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

const REJECTION_TEMPLATES: Record<string, { reason: string; action: string }> = {
  photo: {
    reason: "Uploaded photo does not meet size/dimension requirements.",
    action: "Use SmartDoc Studio to prepare a 200×230px image under 50KB.",
  },
  income: {
    reason: "Income certificate missing or not matching stated income.",
    action: "Upload a valid income certificate from the Document Vault.",
  },
  incomplete: {
    reason: "Application is incomplete — one or more required documents are missing.",
    action: "Go to the scheme's cascade view to see exactly what is missing.",
  },
  default: {
    reason: "Your application was rejected.",
    action: "Review the requirements and reapply with corrected documents.",
  },
};

function getRejectionTemplate(reason?: string) {
  if (!reason) return REJECTION_TEMPLATES.default;
  const lower = reason.toLowerCase();
  if (lower.includes("photo") || lower.includes("image") || lower.includes("size")) return REJECTION_TEMPLATES.photo;
  if (lower.includes("income")) return REJECTION_TEMPLATES.income;
  if (lower.includes("incomplete") || lower.includes("missing")) return REJECTION_TEMPLATES.incomplete;
  return { reason, action: REJECTION_TEMPLATES.default.action };
}

const STATUS_ORDER: Application["status"][] = ["Rejected", "Pending", "Submitted", "Ready", "Draft", "Approved"];

export default function ApplicationsPage() {
  const { userId } = useApp();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getApplications(userId).then(apps => {
      setApplications(apps.sort((a, b) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
      ));
      setLoading(false);
    });
  }, [userId]);

  if (!userId) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <EmptyState icon={FileCheck} title="No applications yet" description="Create your profile to start applying for schemes." actionLabel="Get Started" actionHref="/onboarding" />
    </div>
  );

  if (loading) return <LoadingState message="Loading your applications…" />;

  const grouped = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = applications.filter(a => a.status === status);
    return acc;
  }, {} as Record<string, Application[]>);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Applications</h1>
        <p className="text-sm text-muted-foreground">{applications.length} total application{applications.length !== 1 ? "s" : ""}</p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No applications yet"
          description="Browse eligible schemes and start your application process."
          actionLabel="View Benefits"
          actionHref="/benefits"
        />
      ) : (
        <div className="space-y-6">
          {STATUS_ORDER.map(status => {
            const apps = grouped[status] ?? [];
            if (apps.length === 0) return null;
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <StatusIcon status={status} />
                  <h2 className="font-semibold">{status}</h2>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{apps.length}</span>
                </div>
                <div className="space-y-2">
                  {apps.map(app => (
                    <ApplicationCard
                      key={app.id}
                      app={app}
                      isExpanded={expanded === app.id}
                      onToggle={() => setExpanded(expanded === app.id ? null : app.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ app, isExpanded, onToggle }: { app: Application; isExpanded: boolean; onToggle: () => void }) {
  const template = app.status === "Rejected" ? getRejectionTemplate(app.rejection_reason) : null;
  const schemeName = app.scheme?.title ?? "Unknown Scheme";

  return (
    <div className="bg-background border rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{schemeName}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {app.updated_at ? `Updated ${new Date(app.updated_at).toLocaleDateString("en-IN")}` : ""}
          </div>
        </div>
        <Badge className={`${STATUS_COLORS[app.status]} border-0 shrink-0`}>{app.status}</Badge>
        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t bg-muted/10">
          {/* Status Timeline */}
          <div className="flex items-center gap-1 py-4 text-xs overflow-x-auto">
            {["Created", "Documents", "Submitted", "Processing", app.status === "Approved" ? "Approved" : "Decision"].map((step, i, arr) => {
              const stepStatuses: Record<string, string[]> = {
                "Created": ["Draft", "Ready", "Submitted", "Pending", "Approved", "Rejected"],
                "Documents": ["Ready", "Submitted", "Pending", "Approved", "Rejected"],
                "Submitted": ["Submitted", "Pending", "Approved", "Rejected"],
                "Processing": ["Pending", "Approved", "Rejected"],
                "Approved": ["Approved"],
                "Decision": ["Rejected"],
              };
              const active = (stepStatuses[step] ?? []).includes(app.status);
              return (
                <div key={step} className="flex items-center shrink-0">
                  <div className={`flex flex-col items-center gap-1 ${active ? "text-primary" : "text-muted-foreground"}`}>
                    <div className={`h-2 w-2 rounded-full ${active ? "bg-primary" : "bg-muted"}`} />
                    <span className="text-center leading-tight">{step}</span>
                  </div>
                  {i < arr.length - 1 && <div className={`h-0.5 w-8 mx-1 ${active ? "bg-primary/50" : "bg-muted"}`} />}
                </div>
              );
            })}
          </div>

          {/* Rejection Analyzer */}
          {app.status === "Rejected" && template && (
            <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                <div className="font-semibold text-red-800 text-sm">Rejection Reason</div>
              </div>
              <p className="text-sm text-red-700 mb-3">{template.reason}</p>
              <div className="flex items-start gap-2 bg-white border border-red-200 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-orange-800 mb-0.5">Recommended Action</div>
                  <p className="text-xs text-orange-700">{template.action}</p>
                </div>
              </div>
              {template.action.includes("SmartDoc") && (
                <Link href="/smartdoc" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  Open SmartDoc Studio <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}

          {app.status === "Approved" && (
            <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-800">Your application has been approved. Congratulations!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "Approved": return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "Rejected": return <XCircle className="h-4 w-4 text-red-600" />;
    case "Pending": return <Clock className="h-4 w-4 text-yellow-600" />;
    default: return <FileCheck className="h-4 w-4 text-muted-foreground" />;
  }
}
