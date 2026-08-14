"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/lib/context";
import { getSchemeById, getDocuments } from "@/lib/actions";
import type { Scheme, Document } from "@/lib/types";
import { LoadingState } from "@/components/ui/loading-state";
import { CheckCircle, Lock, AlertTriangle, ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";

interface CascadeStep {
  id: number;
  title: string;
  type: "prerequisite" | "document" | "application";
  status: "complete" | "missing" | "locked";
  description?: string;
}

export default function CascadePage() {
  const { schemeId } = useParams<{ schemeId: string }>();
  const { userId } = useApp();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [steps, setSteps] = useState<CascadeStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, docs] = await Promise.all([
        getSchemeById(schemeId),
        userId ? getDocuments(userId) : Promise.resolve([]),
      ]);
      setScheme(s);
      if (s) {
        setSteps(buildCascade(s, docs));
      }
      setLoading(false);
    }
    load();
  }, [schemeId, userId]);

  if (loading) return <LoadingState message="Building your roadmap…" />;
  if (!scheme) return <div className="p-8 text-center">Scheme not found.</div>;

  const allComplete = steps.every(s => s.status === "complete");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/schemes/${scheme.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Scheme
      </Link>

      <h1 className="text-2xl font-bold mb-1">Application Roadmap</h1>
      <p className="text-sm text-muted-foreground mb-8">{scheme.title}</p>

      {/* Cascade Steps */}
      <div className="relative">
        {steps.map((step, i) => (
          <div key={step.id} className="flex gap-4 mb-2">
            {/* Left: step number + connector */}
            <div className="flex flex-col items-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 z-10 ${
                step.status === "complete" ? "bg-green-500 text-white" :
                step.status === "missing" ? "bg-orange-100 text-orange-700 border-2 border-orange-400" :
                "bg-muted text-muted-foreground"
              }`}>
                {step.status === "complete" ? <CheckCircle className="h-5 w-5" /> :
                 step.status === "locked" ? <Lock className="h-4 w-4" /> :
                 step.id}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-0.5 flex-1 my-1 min-h-[2rem] ${
                  step.status === "complete" ? "bg-green-300" : "bg-muted"
                }`} />
              )}
            </div>

            {/* Right: content */}
            <div className={`flex-1 pb-6 ${step.status === "locked" ? "opacity-50" : ""}`}>
              <div className={`p-4 rounded-xl border ${
                step.status === "complete" ? "bg-green-50 border-green-200" :
                step.status === "missing" ? "bg-orange-50 border-orange-200" :
                "bg-muted/30"
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">{step.title}</div>
                    {step.description && <div className="text-xs text-muted-foreground mt-0.5">{step.description}</div>}
                  </div>
                  <StatusBadge status={step.status} />
                </div>

                {step.status === "missing" && step.type !== "application" && (
                  <div className="mt-3 flex gap-2">
                    <Link href="/documents" className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-1.5 rounded-full font-medium transition-colors">
                      Upload Document
                    </Link>
                    {step.title.toLowerCase().includes("photo") && (
                      <Link href="/smartdoc" className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded-full font-medium transition-colors">
                        Use SmartDoc
                      </Link>
                    )}
                  </div>
                )}

                {step.type === "application" && step.status === "locked" && (
                  <div className="mt-2 text-xs text-muted-foreground">Complete all prerequisites to unlock the application.</div>
                )}

                {step.type === "application" && step.status !== "locked" && (
                  <div className="mt-3">
                    <a href={scheme.application_url ?? "#"} target="_blank" rel="noopener noreferrer"
                      className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-medium hover:bg-primary/90 transition-colors">
                      Apply Now →
                    </a>
                  </div>
                )}
              </div>

              {i < steps.length - 1 && step.status === "complete" && (
                <div className="flex justify-start pl-4 -mt-2 -mb-2">
                  <ChevronDown className="h-4 w-4 text-green-400" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {allComplete && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="font-semibold text-green-800">You&apos;re ready to apply!</div>
          <p className="text-sm text-green-700 mt-1">All prerequisites are complete.</p>
          <a href={scheme.application_url ?? "#"} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-green-800 underline">
            Apply on official portal →
          </a>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CascadeStep["status"] }) {
  if (status === "complete") return (
    <span className="flex items-center gap-1 text-xs text-green-700 font-medium shrink-0">
      <CheckCircle className="h-3.5 w-3.5" /> Complete
    </span>
  );
  if (status === "missing") return (
    <span className="flex items-center gap-1 text-xs text-orange-700 font-medium shrink-0">
      <AlertTriangle className="h-3.5 w-3.5" /> Missing
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium shrink-0">
      <Lock className="h-3.5 w-3.5" /> Locked
    </span>
  );
}

function buildCascade(scheme: Scheme, documents: Document[]): CascadeStep[] {
  const uploadedTypes = documents.map(d => d.document_type.toLowerCase());
  const steps: CascadeStep[] = [];
  let allPreviousComplete = true;
  let stepId = 1;

  for (const prereq of scheme.prerequisites ?? []) {
    const has = uploadedTypes.includes(prereq.toLowerCase());
    steps.push({
      id: stepId++,
      title: prereq,
      type: "prerequisite",
      status: allPreviousComplete ? (has ? "complete" : "missing") : "locked",
      description: "Required prerequisite document",
    });
    if (!has) allPreviousComplete = false;
  }

  for (const doc of scheme.required_documents ?? []) {
    if ((scheme.prerequisites ?? []).includes(doc)) continue; // skip duplicates
    const has = uploadedTypes.includes(doc.toLowerCase());
    steps.push({
      id: stepId++,
      title: doc,
      type: "document",
      status: allPreviousComplete ? (has ? "complete" : "missing") : "locked",
      description: "Required for application",
    });
    if (!has) allPreviousComplete = false;
  }

  steps.push({
    id: stepId,
    title: "Submit Application",
    type: "application",
    status: allPreviousComplete ? "complete" : "locked",
    description: "Official application submission",
  });

  return steps;
}
