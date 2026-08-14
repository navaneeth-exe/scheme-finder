"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Zap, FileCheck, Mic, Shield } from "lucide-react";
import { useApp } from "@/lib/context";
import { setupDemoMode } from "@/lib/actions";
import { useState } from "react";

export default function LandingPage() {
  const { enableDemoMode } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDemoMode() {
    setLoading(true);
    try {
      await setupDemoMode();
      enableDemoMode();
      router.push("/dashboard");
    } catch {
      // Fallback: still enable demo mode with local data
      enableDemoMode();
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center bg-gradient-to-b from-background to-muted/30">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium rounded-full px-4 py-1.5 mb-6">
          <Zap className="h-3.5 w-3.5" />
          <span>Smart Scheme Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-3xl">
          Government Benefits.{" "}
          <span className="text-primary">Made Actionable.</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mb-10">
          SATURNX helps you discover, prepare and apply for government benefits you may be eligible for.
          From eligibility to approval — every step guided.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Link
            href="/onboarding"
            className="flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-medium text-base hover:bg-primary/90 transition-colors w-full"
          >
            Check My Benefits
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            onClick={handleDemoMode}
            disabled={loading}
            className="flex items-center justify-center gap-2 h-12 px-6 rounded-full border font-medium text-base hover:bg-muted transition-colors w-full disabled:opacity-60"
          >
            {loading ? "Setting up..." : "Try Demo"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Discover and prepare for benefits you may be eligible for.
          We do not guarantee government benefits.
        </p>
      </section>

      {/* Feature Grid */}
      <section className="border-t bg-background py-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
          {[
            {
              icon: Mic,
              title: "Voice Onboarding",
              desc: "Tell us about yourself in plain language. Our system extracts your profile automatically.",
            },
            {
              icon: Shield,
              title: "Benefit Intelligence",
              desc: "Transparent, rule-based matching shows exactly why you qualify — no black boxes.",
            },
            {
              icon: FileCheck,
              title: "Application Readiness",
              desc: "See what's missing before you apply. The system tracks every prerequisite.",
            },
            {
              icon: Zap,
              title: "SmartDoc Studio",
              desc: "Prepare your passport photo (200×230, under 50KB) directly in the browser.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Journey Steps */}
      <section className="bg-muted/30 py-16 px-4 border-t">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Your Journey with SATURNX</h2>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            {[
              "Profile", "Eligibility", "Prerequisites",
              "Documents", "Application", "Tracking", "Resolution"
            ].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="bg-background border rounded-full px-4 py-2 font-medium">{step}</span>
                {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
