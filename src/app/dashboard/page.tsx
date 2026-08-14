"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { getSchemes, getApplications, getDocuments } from "@/lib/actions";
import { matchAllSchemes, calcTotalBenefit } from "@/lib/matching";
import type { MatchResult, Application, Document } from "@/lib/types";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle, XCircle, ArrowRight, Gift, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { ProfileProgress } from "@/components/dashboard/ProfileProgress";

export default function DashboardPage() {
  const { profile, userId, isDemoMode } = useApp();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    async function load() {
      const [schemes, apps, docs] = await Promise.all([
        getSchemes(),
        getApplications(userId!),
        getDocuments(userId!),
      ]);
      if (profile && schemes.length > 0) {
        setMatches(matchAllSchemes(profile, schemes));
      }
      setApplications(apps);
      setDocuments(docs);
      setLoading(false);
    }
    load();
  }, [userId, profile]);

  if (!userId || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-4">
        <div className="text-center">
          <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Welcome to SATURNX</h1>
          <p className="text-muted-foreground mb-6">Create your profile to discover government benefits tailored for you.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/onboarding" className="flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingState message="Calculating your benefits…" />;

  const eligible = matches.filter(m => m.isEligible);
  const totalBenefit = calcTotalBenefit(matches);
  const urgentActions = [
    ...eligible.filter(m => m.deadlineUrgency === "urgent").map(m => ({
      type: "deadline" as const,
      label: `Deadline approaching: ${m.scheme.title}`,
      href: `/schemes/${m.scheme.id}`,
    })),
    ...applications.filter(a => a.status === "Rejected").map(a => ({
      type: "rejected" as const,
      label: `Application rejected: ${a.scheme?.title ?? "Scheme"}`,
      href: `/applications/${a.id}`,
    })),
  ];

  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {isDemoMode && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800">
          <span className="font-medium">Demo Mode</span> — Showing data for Rahul Menon (OBC, Kerala, ₹2.5L income)
        </div>
      )}

      {/* Benefit Hero */}
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 border rounded-2xl p-6">
        <p className="text-sm text-muted-foreground mb-1">Hello {firstName} 👋</p>
        <h1 className="text-lg font-semibold mb-3">Your household may be eligible for</h1>
        <div className="text-4xl font-bold text-primary mb-1">
          ₹{totalBenefit.toLocaleString("en-IN")}
        </div>
        <p className="text-sm text-muted-foreground mb-4">in potential benefits across {eligible.length} scheme{eligible.length !== 1 ? "s" : ""}</p>
        <Link href="/benefits" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          View all benefits <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      {/* Profile Readiness */}
      <ProfileProgress />

      {/* Action Required */}
      {urgentActions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Action Required</h2>
          <div className="space-y-2">
            {urgentActions.map((action, i) => (
              <Link key={i} href={action.href} className="flex items-center gap-3 p-4 bg-background border rounded-xl hover:shadow-sm transition-shadow">
                {action.type === "deadline" ? (
                  <Clock className="h-5 w-5 text-orange-500 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                )}
                <span className="text-sm flex-1">{action.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Gift, label: "Eligible", value: eligible.length, color: "text-green-600" },
          { icon: TrendingUp, label: "Matched", value: matches.length, color: "text-blue-600" },
          { icon: CheckCircle, label: "Documents", value: documents.length, color: "text-purple-600" },
          { icon: AlertTriangle, label: "Pending Action", value: urgentActions.length, color: "text-orange-500" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-background border rounded-xl p-4">
            <Icon className={`h-5 w-5 ${color} mb-2`} />
            <div className="text-xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </section>

      {/* Recommended Benefits */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recommended Benefits</h2>
          <Link href="/benefits" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {eligible.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="No matches yet"
            description="Complete your profile so we can find matching government schemes."
            actionLabel="Update Profile"
            actionHref="/onboarding"
          />
        ) : (
          <div className="space-y-3">
            {eligible.slice(0, 4).map(m => (
              <Link key={m.scheme.id} href={`/schemes/${m.scheme.id}`}>
                <BenefitCard match={m} documents={documents} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Family Quick Access */}
      <section className="flex items-center gap-4 p-4 bg-background border rounded-xl">
        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">Family Benefits</div>
          <div className="text-xs text-muted-foreground">See opportunities for your entire household</div>
        </div>
        <Link href="/family" className="shrink-0">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </section>
    </div>
  );
}

function BenefitCard({ match, documents }: { match: MatchResult; documents: Document[] }) {
  const uploadedTypes = documents.map(d => d.document_type.toLowerCase());
  const required = match.scheme.required_documents ?? [];
  const missing = required.filter(r => !uploadedTypes.includes(r.toLowerCase()));
  const readiness = required.length > 0
    ? Math.round(((required.length - missing.length) / required.length) * 100)
    : 100;

  return (
    <div className="flex items-start gap-4 p-4 bg-background border rounded-xl hover:shadow-sm transition-shadow">
      <div className="shrink-0 flex flex-col items-center gap-1">
        <div className="text-xl font-bold text-primary">{match.score}%</div>
        <div className="text-xs text-muted-foreground">match</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm mb-1 truncate">{match.scheme.title}</div>
        <div className="text-xs text-muted-foreground mb-2">Up to ₹{match.potentialBenefit.toLocaleString("en-IN")} • {match.scheme.ministry}</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${readiness}%` }} />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{readiness}% ready</span>
        </div>
      </div>
      {match.deadlineUrgency === "urgent" && (
        <Badge variant="destructive" className="shrink-0 text-xs">Urgent</Badge>
      )}
    </div>
  );
}
