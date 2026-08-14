/**
 * ai.ts - Deterministic intent-based assistant
 * No paid LLM. No RAG. Pure rule-based query handling.
 */

import type { MatchResult, Document } from "./types";

export type AssistantIntent =
  | "benefits"
  | "documents"
  | "deadline"
  | "eligible"
  | "applications"
  | "help"
  | "unknown";

export interface AssistantResponse {
  intent: AssistantIntent;
  message: string;
  data?: unknown;
}

const INTENT_KEYWORDS: Record<AssistantIntent, string[]> = {
  benefits: ["benefit", "scheme", "grant", "scholarship", "eligible for", "qualify", "apply"],
  documents: ["document", "certificate", "aadhaar", "missing", "upload", "file"],
  deadline: ["deadline", "expiry", "last date", "when", "due", "time left"],
  eligible: ["eligible", "qualify", "match", "why am i", "am i eligible"],
  applications: ["application", "status", "submitted", "pending", "rejected", "approved"],
  help: ["help", "what can", "guide", "how to", "start"],
  unknown: [],
};

function detectIntent(query: string): AssistantIntent {
  const lower = query.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === "unknown") continue;
    if (keywords.some(k => lower.includes(k))) return intent as AssistantIntent;
  }
  return "unknown";
}

export function getAssistantResponse(
  query: string,
  context: {
    matches?: MatchResult[];
    documents?: Document[];
    userName?: string;
  }
): AssistantResponse {
  const intent = detectIntent(query);
  const { matches = [], documents = [], userName = "there" } = context;

  switch (intent) {
    case "benefits": {
      const eligible = matches.filter(m => m.isEligible);
      if (eligible.length === 0) {
        return {
          intent,
          message: "I couldn't find any matching schemes yet. Make sure your profile is complete so I can match you accurately.",
        };
      }
      const top = eligible[0];
      return {
        intent,
        message: `Hi ${userName}! You have ${eligible.length} eligible scheme${eligible.length > 1 ? "s" : ""}. Your top match is **${top.scheme.title}** with a ${top.score}% match score and up to ₹${top.potentialBenefit.toLocaleString("en-IN")} in potential benefit.`,
        data: eligible.slice(0, 3),
      };
    }

    case "documents": {
      const uploaded = documents.map(d => d.document_type);
      if (uploaded.length === 0) {
        return {
          intent,
          message: "You haven't uploaded any documents yet. Head to the **Documents** section to upload your Income Certificate, Aadhaar, and Bonafide Certificate.",
        };
      }
      const required = matches
        .filter(m => m.isEligible)
        .flatMap(m => m.scheme.required_documents ?? []);
      const unique = [...new Set(required)];
      const missing = unique.filter(r => !uploaded.some(u => u.toLowerCase() === r.toLowerCase()));
      if (missing.length === 0) {
        return {
          intent,
          message: `Great news! You've uploaded all the required documents (${uploaded.join(", ")}). You're ready to apply!`,
          data: uploaded,
        };
      }
      return {
        intent,
        message: `You're missing **${missing.length}** document(s): ${missing.join(", ")}. Upload them in the Documents section.`,
        data: missing,
      };
    }

    case "deadline": {
      const withDeadlines = matches
        .filter(m => m.isEligible && m.scheme.deadline)
        .sort((a, b) => new Date(a.scheme.deadline!).getTime() - new Date(b.scheme.deadline!).getTime());
      if (withDeadlines.length === 0) {
        return {
          intent,
          message: "No upcoming deadlines for your matched schemes right now.",
        };
      }
      const next = withDeadlines[0];
      const daysLeft = Math.ceil((new Date(next.scheme.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        intent,
        message: `Your closest deadline is **${next.scheme.title}** — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left (${new Date(next.scheme.deadline!).toLocaleDateString("en-IN")}). Save it to your calendar from the scheme page!`,
        data: withDeadlines.slice(0, 3).map(m => m.scheme),
      };
    }

    case "eligible": {
      const eligible = matches.filter(m => m.isEligible);
      if (eligible.length === 0) {
        return {
          intent,
          message: "Based on your current profile, no schemes are a full match yet. Check if your income, state, and category are filled in correctly.",
        };
      }
      const top = eligible[0];
      const passed = top.matchFactors.filter(f => f.passed).map(f => f.label);
      return {
        intent,
        message: `You are eligible for **${eligible.length} scheme${eligible.length > 1 ? "s" : ""}**! For your top match (${top.scheme.title}), you qualify because: ${passed.join(", ")}.`,
        data: eligible,
      };
    }

    case "applications": {
      return {
        intent,
        message: "You can track all your applications in the **Applications** section. If any are rejected, the Rejection Analyzer will show you exactly what to fix.",
      };
    }

    case "help": {
      return {
        intent,
        message: `Hi ${userName}! I can help you with:\n• **"What benefits do I have?"** — See your matched schemes\n• **"What documents am I missing?"** — Check document status\n• **"Which deadline is closest?"** — Upcoming deadlines\n• **"Why am I eligible?"** — Eligibility explanation`,
      };
    }

    default: {
      return {
        intent: "unknown",
        message: "I'm not sure I understood that. Try asking about your benefits, missing documents, or upcoming deadlines.",
      };
    }
  }
}
