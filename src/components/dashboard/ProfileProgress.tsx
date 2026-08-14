"use client";

import { useApp } from "@/lib/context";
import { CheckCircle2, Circle } from "lucide-react";

export function ProfileProgress() {
  const { profile } = useApp();

  if (!profile) return null;

  const fields = [
    { name: "Basic Info", filled: !!profile.full_name && !!profile.state },
    { name: "Income Details", filled: !!profile.annual_income },
    { name: "Education", filled: !!profile.education },
    { name: "Category", filled: !!profile.caste_category },
    { name: "Occupation", filled: !!profile.occupation },
  ];

  const completed = fields.filter((f) => f.filled).length;
  const total = fields.length;
  const percentage = Math.round((completed / total) * 100);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-background border rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
      <div className="relative flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-primary transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{percentage}%</span>
        </div>
      </div>
      
      <div className="flex-1 w-full">
        <h3 className="text-lg font-semibold mb-2">Profile Readiness</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Complete your profile to unlock higher-accuracy scheme matching.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {fields.map((field) => (
            <div key={field.name} className="flex items-center gap-2 text-sm">
              {field.filled ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={field.filled ? "text-foreground" : "text-muted-foreground"}>
                {field.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
