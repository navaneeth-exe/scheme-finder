"use client";

import { useApp } from "@/lib/context";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Zap, Shield, Moon } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { profile, isDemoMode, disableDemoMode, enableDemoMode } = useApp();
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleToggleDemo() {
    setDemoLoading(true);
    if (isDemoMode) {
      disableDemoMode();
      router.push("/");
    } else {
      const { setupDemoMode } = await import("@/lib/actions");
      await setupDemoMode();
      enableDemoMode();
      router.push("/dashboard");
    }
    setDemoLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Profile Summary */}
      {profile && (
        <div className="p-5 bg-background border rounded-xl mb-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold">{profile.full_name}</div>
            <div className="text-sm text-muted-foreground truncate">{profile.email}</div>
            {isDemoMode && <div className="text-xs text-amber-600 font-medium mt-0.5">Demo Mode Active</div>}
          </div>
          <Link href="/onboarding" className="text-sm text-primary hover:underline shrink-0">Edit</Link>
        </div>
      )}

      <div className="space-y-3">
        {/* Demo Mode */}
        <div className="p-5 bg-background border rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="font-medium text-sm">Demo Mode</div>
              <div className="text-xs text-muted-foreground">Load sample data (Rahul Menon, OBC, Kerala)</div>
            </div>
          </div>
          <button onClick={handleToggleDemo} disabled={demoLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isDemoMode ? "bg-primary" : "bg-muted"}`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isDemoMode ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Privacy */}
        <div className="p-5 bg-background border rounded-xl flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <div className="font-medium text-sm">Privacy</div>
            <div className="text-xs text-muted-foreground">
              All image processing happens in your browser. No documents are uploaded to external servers.
            </div>
          </div>
        </div>

        {/* About */}
        <div className="p-5 bg-background border rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="font-medium text-sm">About SATURNX</div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            SATURNX is a hackathon project that helps citizens discover, prepare, and apply for government 
            welfare and scholarship schemes. Built with Next.js 15, Supabase, and zero paid AI APIs.
          </p>
          <div className="mt-3 text-xs text-muted-foreground">
            Infrastructure cost: <strong>₹0</strong> (free tier + browser-side processing)
          </div>
        </div>

        {/* Sign Out */}
        {profile && (
          <button onClick={() => { disableDemoMode(); router.push("/"); }}
            className="w-full flex items-center gap-3 p-4 bg-background border rounded-xl text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="h-5 w-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        )}
      </div>
    </div>
  );
}
