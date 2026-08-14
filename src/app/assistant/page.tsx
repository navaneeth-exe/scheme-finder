"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/context";
import { getSchemes, getDocuments } from "@/lib/actions";
import { matchAllSchemes } from "@/lib/matching";
import { getAssistantResponse, type AssistantResponse } from "@/lib/ai";
import type { MatchResult, Document } from "@/lib/types";
import { Send, MessageSquare, Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: unknown;
}

const SUGGESTIONS = [
  "What benefits do I have?",
  "What documents am I missing?",
  "Which deadline is closest?",
  "Why am I eligible?",
];

export default function AssistantPage() {
  const { profile, userId } = useApp();
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "assistant",
    content: profile
      ? `Hi ${profile.full_name?.split(" ")[0] ?? "there"}! 👋 I'm your SATURNX assistant. I can help you understand your benefits, check missing documents, and track deadlines. What would you like to know?`
      : "Hi! 👋 I'm your SATURNX assistant. Please set up your profile first so I can help you find the best government benefits for you.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<{ matches: MatchResult[]; documents: Document[] }>({ matches: [], documents: [] });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId || !profile) return;
    async function loadCtx() {
      const [schemes, docs] = await Promise.all([getSchemes(), getDocuments(userId!)]);
      setContext({ matches: matchAllSchemes(profile!, schemes), documents: docs });
    }
    loadCtx();
  }, [userId, profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text?: string) {
    const query = text ?? input.trim();
    if (!query) return;
    setInput("");
    setLoading(true);

    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: query }]);

    await new Promise(r => setTimeout(r, 300)); // small delay for UX

    const response: AssistantResponse = getAssistantResponse(query, {
      matches: context.matches,
      documents: context.documents,
      userName: profile?.full_name?.split(" ")[0],
    });

    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.message,
      data: response.data,
    }]);
    setLoading(false);
  }

  function formatMessage(content: string) {
    // Simple bold markdown
    return content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 py-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm">SATURNX Assistant</div>
            <div className="text-xs text-muted-foreground">Rule-based • No AI hallucination</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary" : "bg-muted"}`}>
              {msg.role === "user" ? <User className="h-4 w-4 text-primary-foreground" /> : <Bot className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm"
                }`}
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
              />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="px-4 py-3 bg-muted rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => handleSend(s)}
              className="text-xs bg-muted hover:bg-muted/80 rounded-full px-3 py-1.5 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-4 border-t bg-background">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about your benefits, documents, or deadlines…"
            className="flex-1 h-11 px-4 border rounded-full bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          <button onClick={() => handleSend()} disabled={!input.trim() || loading}
            className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
