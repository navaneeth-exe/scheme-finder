"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { getSchemes } from "@/lib/actions";
import type { Scheme } from "@/lib/types";
import { downloadICS } from "@/lib/calendar";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Clock, Download, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function CalendarPage() {
  const { userId } = useApp();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

  useEffect(() => {
    getSchemes().then(s => {
      setSchemes(s.filter(sc => sc.deadline).sort((a, b) =>
        new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
      ));
      setLoading(false);
    });
  }, []);

  function handleDownload(scheme: Scheme) {
    if (!scheme.deadline) return;
    downloadICS(scheme.title, scheme.deadline);
    setDownloaded(prev => new Set([...prev, scheme.id]));
  }

  if (loading) return <LoadingState message="Loading deadlines…" />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Deadlines</h1>
        <p className="text-sm text-muted-foreground">Download .ics files to add scheme deadlines to your calendar</p>
      </div>

      {schemes.length === 0 ? (
        <EmptyState icon={Calendar} title="No upcoming deadlines" description="No schemes with deadlines found." />
      ) : (
        <div className="space-y-3">
          {schemes.map(scheme => {
            const daysLeft = scheme.deadline
              ? Math.ceil((new Date(scheme.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
            const isUrgent = daysLeft !== null && daysLeft <= 15;
            const isPast = daysLeft !== null && daysLeft < 0;
            return (
              <div key={scheme.id} className={`p-4 bg-background border rounded-xl ${isUrgent && !isPast ? "border-orange-300 bg-orange-50" : ""} ${isPast ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isUrgent && !isPast ? "bg-orange-100" : "bg-muted"}`}>
                    {isUrgent && !isPast ? <AlertTriangle className="h-5 w-5 text-orange-600" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{scheme.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{scheme.ministry}</div>
                    <div className={`text-sm font-medium mt-1 ${isUrgent && !isPast ? "text-orange-700" : isPast ? "text-muted-foreground line-through" : ""}`}>
                      {isPast ? "Expired" : scheme.deadline ? new Date(scheme.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}
                      {!isPast && daysLeft !== null && <span className="text-muted-foreground font-normal"> · {daysLeft} days left</span>}
                    </div>
                  </div>
                  {!isPast && (
                    <button onClick={() => handleDownload(scheme)}
                      className="flex items-center gap-1.5 h-9 px-3 rounded-full border text-xs font-medium hover:bg-muted transition-colors shrink-0">
                      {downloaded.has(scheme.id) ? "✓ Saved" : <><Download className="h-3.5 w-3.5" /> .ics</>}
                    </button>
                  )}
                </div>
                <div className="mt-3 flex gap-2 pl-13">
                  <Link href={`/schemes/${scheme.id}`} className="text-xs text-primary hover:underline">View Scheme</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-muted/30 rounded-xl text-xs text-muted-foreground">
        <strong className="text-foreground">How it works:</strong> The .ics file is generated entirely in your browser.
        Open it to add the deadline to Google Calendar, Apple Calendar, or Outlook.
        A reminder is set 7 days before the deadline.
      </div>
    </div>
  );
}
