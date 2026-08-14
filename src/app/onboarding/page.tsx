"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, RotateCcw, CheckCircle, ChevronRight, User } from "lucide-react";
import { parseProfileText, type ParsedProfile } from "@/lib/parser";
import { saveVoiceProfile, saveProfile } from "@/lib/actions";
import { useApp } from "@/lib/context";
import { demoUser } from "@/lib/seed";
import { cn } from "@/lib/utils";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu",
  "Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
];

const EDUCATIONS = ["Secondary (10th)","Higher Secondary (12th)","Diploma","ITI","Undergraduate","Graduate","Postgraduate","PhD"];
const CATEGORIES = ["General","OBC","SC","ST","EWS"];
const OCCUPATIONS = ["Student","Farmer","Self-Employed","Salaried","Government Employee","Teacher","Doctor","Engineer","Homemaker","Unemployed"];

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
}

export default function OnboardingPage() {
  const { setProfile } = useApp();
  const router = useRouter();
  const [step, setStep] = useState<"voice" | "review" | "saving">("voice");
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [parsed, setParsed] = useState<ParsedProfile>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const hasSR = typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    setHasSpeechSupport(hasSR);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new (SpeechRecognition as new () => SpeechRecognition)();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-IN";
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript).join(" ");
      setTranscript(t);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recRef.current = rec;
    rec.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setIsListening(false);
  }, []);

  function processTranscript() {
    const result = parseProfileText(transcript);
    setParsed(result);
    setStep("review");
  }

  async function handleSave() {
    setStep("saving");
    try {
      const userId = demoUser.id;
      const profileData = {
        id: userId,
        full_name: name || "Guest User",
        email: email || `guest_${Date.now()}@saturnx.in`,
        voice_raw_text: transcript,
        annual_income: parsed.annual_income,
        caste_category: parsed.caste_category,
        state: parsed.state,
        occupation: parsed.occupation,
        education: parsed.education,
      };
      await saveProfile(profileData);
      setProfile(profileData);
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  }

  if (step === "saving") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground">Setting up your profile…</p>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Review Your Profile</h1>
          <p className="text-muted-foreground">We extracted the following from your input. Correct anything that looks wrong.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          {[
            { label: "Full Name", key: "name", value: name, onChange: setName, type: "text", placeholder: "Your full name" },
            { label: "Email", key: "email", value: email, onChange: setEmail, type: "email", placeholder: "your@email.com" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              <input
                type={f.type}
                value={f.value}
                onChange={e => f.onChange(e.target.value)}
                placeholder={f.placeholder}
                className="w-full h-11 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          ))}
          <ParsedField label="Annual Income (₹)" value={parsed.annual_income?.toString()} placeholder="e.g., 250000" onChange={v => setParsed(p => ({ ...p, annual_income: parseInt(v.replace(/\D/g, "")) || undefined }))} />
          
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <select value={parsed.state ?? ""} onChange={e => setParsed(p => ({ ...p, state: e.target.value || undefined }))} className="w-full h-11 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option value="">Select state</option>
              {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Education</label>
            <select value={parsed.education ?? ""} onChange={e => setParsed(p => ({ ...p, education: e.target.value || undefined }))} className="w-full h-11 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option value="">Select education</option>
              {EDUCATIONS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Occupation</label>
            <select value={parsed.occupation ?? ""} onChange={e => setParsed(p => ({ ...p, occupation: e.target.value || undefined }))} className="w-full h-11 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option value="">Select occupation</option>
              {OCCUPATIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Caste Category</label>
            <select value={parsed.caste_category ?? ""} onChange={e => setParsed(p => ({ ...p, caste_category: e.target.value || undefined }))} className="w-full h-11 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep("voice")} className="flex items-center gap-2 h-11 px-5 rounded-full border font-medium hover:bg-muted transition-colors">
            <RotateCcw className="h-4 w-4" /> Redo
          </button>
          <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            Save & See My Benefits <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Voice step
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Tell us about yourself</h1>
        <p className="text-muted-foreground">
          Speak or type a few sentences about yourself and we&apos;ll find matching government benefits.
        </p>
      </div>

      <div className="bg-muted/30 border rounded-2xl p-6 mb-6">
        <p className="text-sm text-muted-foreground mb-3 font-medium">Example:</p>
        <p className="text-base italic text-foreground/70">
          &ldquo;I&apos;m a 20-year-old engineering student from Kerala with a family income of 2.5 lakh. I belong to the OBC category.&rdquo;
        </p>
      </div>

      {hasSpeechSupport ? (
        <div className="flex flex-col items-center gap-6 mb-8">
          <button
            onClick={isListening ? stopListening : startListening}
            className={cn(
              "h-24 w-24 rounded-full flex items-center justify-center transition-all",
              isListening
                ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-200"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
            )}
          >
            {isListening ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
          </button>
          <p className="text-sm text-muted-foreground">
            {isListening ? "Listening… click to stop" : "Click the mic to start speaking"}
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
          Voice recognition isn&apos;t supported in this browser. Please type your details below.
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Your details</label>
        <textarea
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          rows={4}
          placeholder="Type or speak: 'I'm a 20-year-old student from Kerala with an income of 2.5 lakh, OBC category...'"
          className="w-full px-4 py-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
        />
      </div>

      <button
        onClick={processTranscript}
        disabled={!transcript.trim()}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-medium text-base hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        <CheckCircle className="h-5 w-5" />
        Continue
      </button>

      <div className="mt-8 border-t pt-6">
        <p className="text-sm text-center text-muted-foreground mb-3">Or fill in manually</p>
        <button
          onClick={() => { setParsed({}); setStep("review"); }}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-full border font-medium hover:bg-muted transition-colors text-sm"
        >
          <User className="h-4 w-4" /> Enter details manually
        </button>
      </div>
    </div>
  );
}

function ParsedField({ label, value, placeholder, onChange }: { label: string; value?: string; placeholder: string; onChange: (v: string) => void; }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type="text"
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
      />
    </div>
  );
}
