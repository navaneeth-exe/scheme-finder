"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { getSchemeById, getDocuments, createApplication, saveDeadline } from "@/lib/actions";
import { matchScheme } from "@/lib/matching";
import { downloadICS } from "@/lib/calendar";
import type { Scheme, Document, MatchResult } from "@/lib/types";
import { LoadingState } from "@/components/ui/loading-state";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Calendar, FileCheck, ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";

export default function SchemeDetailPage() {
  const { schemeId } = useParams<{ schemeId: string }>();
  const { profile, userId } = useApp();
  const router = useRouter();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deadlineSaved, setDeadlineSaved] = useState(false);
  const [appStarted, setAppStarted] = useState(false);

  useEffect(() => {
    async function load() {
      const [s, docs] = await Promise.all([
        getSchemeById(schemeId),
        userId ? getDocuments(userId) : Promise.resolve([]),
      ]);
      setScheme(s);
      setDocuments(docs);
      if (s && profile) setMatch(matchScheme(profile, s));
      setLoading(false);
    }
    load();
  }, [schemeId, profile, userId]);

  if (loading) return <LoadingState message="Loading scheme details…" />;
  if (!scheme) return <div className="p-8 text-center text-muted-foreground">Scheme not found.</div>;

  const uploadedTypes = documents.map(d => d.document_type.toLowerCase());
  const required = scheme.required_documents ?? [];
  const prerequisites = scheme.prerequisites ?? [];
  const missing = required.filter(r => !uploadedTypes.includes(r.toLowerCase()));
  const readiness = required.length > 0 ? Math.round(((required.length - missing.length) / required.length) * 100) : 100;
  const daysLeft = scheme.deadline ? Math.ceil((new Date(scheme.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  async function handleSaveDeadline() {
    if (!userId || !scheme?.deadline) return;
    setSaving(true);
    await saveDeadline(userId, scheme.id, scheme.deadline);
    downloadICS(scheme.title, scheme.deadline);
    setDeadlineSaved(true);
    setSaving(false);
  }

  async function handleStartApplication() {
    if (!userId) { router.push("/onboarding"); return; }
    setAppStarted(true);
    await createApplication(userId, scheme!.id);
    router.push("/applications");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link href="/benefits" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Benefits
        </Link>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-2xl font-bold">{scheme.title}</h1>
          {match && (
            <div className="shrink-0 text-center">
              <div className="text-2xl font-bold text-primary">{match.score}%</div>
              <div className="text-xs text-muted-foreground">match</div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {scheme.ministry && <Badge variant="secondary">{scheme.ministry}</Badge>}
          {scheme.category && <Badge variant="outline">{scheme.category}</Badge>}
          {scheme.state && <Badge variant="outline">{scheme.state}</Badge>}
        </div>
      </div>

      {/* Benefit */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <div className="text-xs text-green-700 font-medium mb-1">POTENTIAL BENEFIT</div>
        <div className="text-2xl font-bold text-green-800">
          ₹{(scheme.min_benefit_amount ?? 0).toLocaleString("en-IN")} – ₹{(scheme.max_benefit_amount ?? 0).toLocaleString("en-IN")}
        </div>
        {scheme.deadline && (
          <div className={`text-sm mt-1 ${daysLeft && daysLeft <= 15 ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
            Deadline: {new Date(scheme.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            {daysLeft !== null && ` (${daysLeft} days left)`}
          </div>
        )}
      </div>

      {/* Description */}
      {scheme.description && (
        <div>
          <h2 className="font-semibold mb-2">About this Scheme</h2>
          <p className="text-sm text-muted-foreground">{scheme.description}</p>
        </div>
      )}

      {/* Why You Match */}
      {match && (
        <div>
          <h2 className="font-semibold mb-3">Why You Match</h2>
          <div className="space-y-2">
            {match.matchFactors.filter(f => f.label !== "Deadline Urgency").map(f => (
              <div key={f.label} className={`flex items-start gap-3 p-3 rounded-lg ${f.passed ? "bg-green-50" : "bg-red-50"}`}>
                {f.passed ? (
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className={`text-sm font-medium ${f.passed ? "text-green-800" : "text-red-800"}`}>{f.label}</div>
                  {f.detail && <div className="text-xs text-muted-foreground">{f.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Readiness */}
      {required.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Application Readiness</h2>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${readiness}%` }} />
            </div>
            <span className="text-sm font-medium shrink-0">{readiness}%</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{required.length - missing.length} / {required.length} requirements complete</p>
          <div className="space-y-2">
            {required.map(doc => {
              const has = uploadedTypes.includes(doc.toLowerCase());
              return (
                <div key={doc} className={`flex items-center gap-3 p-3 rounded-lg ${has ? "bg-green-50" : "bg-orange-50"}`}>
                  {has ? <CheckCircle className="h-4 w-4 text-green-600 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />}
                  <span className="text-sm">{doc}</span>
                  {!has && (
                    <Link href="/documents" className="ml-auto text-xs text-primary hover:underline">Upload</Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prerequisites */}
      {prerequisites.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Prerequisites</h2>
          <div className="space-y-2">
            {prerequisites.map(p => {
              const has = uploadedTypes.includes(p.toLowerCase());
              return (
                <div key={p} className={`flex items-center gap-3 p-3 rounded-lg border ${has ? "bg-green-50 border-green-200" : "bg-muted/30"}`}>
                  {has ? <CheckCircle className="h-4 w-4 text-green-600 shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground shrink-0" />}
                  <span className="text-sm">{p}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        {scheme.application_url && (
          <a href={scheme.application_url} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            Apply Officially <ExternalLink className="h-4 w-4" />
          </a>
        )}

        <button onClick={handleSaveDeadline} disabled={saving || deadlineSaved || !scheme.deadline}
          className="flex items-center justify-center gap-2 h-12 px-5 rounded-full border font-medium hover:bg-muted transition-colors disabled:opacity-60">
          {deadlineSaved ? <><CheckCircle className="h-4 w-4 text-green-600" /> Saved!</> : saving ? "Saving…" : <><Calendar className="h-4 w-4" /> Save Deadline</>}
        </button>

        <Link href={`/cascade/${scheme.id}`}
          className="flex items-center justify-center gap-2 h-12 px-5 rounded-full border font-medium hover:bg-muted transition-colors">
          <Zap className="h-4 w-4" /> View Cascade
        </Link>
      </div>

      {readiness < 100 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="font-medium text-sm text-blue-900 mb-1">Need help with documents?</div>
          <p className="text-xs text-blue-700 mb-2">Use SmartDoc Studio to prepare your passport photo (200×230px, under 50KB) directly in your browser.</p>
          <Link href="/smartdoc" className="text-xs text-blue-700 font-medium hover:underline">Open SmartDoc Studio →</Link>
        </div>
      )}
    </div>
  );
}
