"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { getSchemes, getDocuments } from "@/lib/actions";
import { matchAllSchemes } from "@/lib/matching";
import type { MatchResult, Document } from "@/lib/types";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, ArrowRight, Gift } from "lucide-react";
import Link from "next/link";

export default function BenefitsPage() {
  const { profile, userId } = useApp();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "eligible" | "partial">("eligible");

  useEffect(() => {
    if (!userId || !profile) { setLoading(false); return; }
    async function load() {
      const [schemes, docs] = await Promise.all([getSchemes(), getDocuments(userId!)]);
      setMatches(matchAllSchemes(profile!, schemes));
      setDocuments(docs);
      setLoading(false);
    }
    load();
  }, [userId, profile]);

  if (!userId) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <EmptyState icon={Gift} title="Set up your profile first" description="We need your details to match you with benefits." actionLabel="Create Profile" actionHref="/onboarding" />
    </div>
  );

  if (loading) return <LoadingState message="Finding your benefits…" />;

  const uploadedTypes = documents.map(d => d.document_type.toLowerCase());
  const filtered = filter === "all" ? matches : filter === "eligible" ? matches.filter(m => m.isEligible) : matches.filter(m => m.score >= 40 && !m.isEligible);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Your Benefits</h1>
        <p className="text-muted-foreground text-sm">Schemes matched to your profile</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-muted/50 rounded-lg w-fit">
        {([["eligible", "Eligible"], ["all", "All"], ["partial", "Partial Match"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Gift} title="No schemes in this category" description="Try switching to 'All' to see all matched schemes." />
      ) : (
        <div className="space-y-4">
          {filtered.map(m => {
            const required = m.scheme.required_documents ?? [];
            const missing = required.filter(r => !uploadedTypes.includes(r.toLowerCase()));
            const readiness = required.length > 0 ? Math.round(((required.length - missing.length) / required.length) * 100) : 100;
            return (
              <Link key={m.scheme.id} href={`/schemes/${m.scheme.id}`}>
                <div className="p-5 bg-background border rounded-xl hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold mb-0.5">{m.scheme.title}</div>
                      <div className="text-xs text-muted-foreground">{m.scheme.ministry} • {m.scheme.category}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xl font-bold text-primary">{m.score}%</div>
                      <div className="text-xs text-muted-foreground">match</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3 text-sm">
                    <span className="font-medium text-green-700">
                      ₹{(m.scheme.min_benefit_amount ?? 0).toLocaleString("en-IN")} – ₹{(m.potentialBenefit).toLocaleString("en-IN")}
                    </span>
                    {m.scheme.deadline && (
                      <span className="text-muted-foreground">
                        Due: {new Date(m.scheme.deadline).toLocaleDateString("en-IN")}
                      </span>
                    )}
                    {m.deadlineUrgency === "urgent" && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
                  </div>

                  {/* Match Factors */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {m.matchFactors.filter(f => f.label !== "Deadline Urgency").map(f => (
                      <div key={f.label} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${f.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                        {f.passed ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {f.label}
                      </div>
                    ))}
                  </div>

                  {/* Readiness */}
                  {required.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${readiness}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{readiness}% ready</span>
                      {missing.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-orange-600">
                          <AlertTriangle className="h-3 w-3" /> {missing.length} missing
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
