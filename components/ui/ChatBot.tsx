"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, X, Send, Loader2, Bot,
  Briefcase, ChevronRight, Sparkles,
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Render assistant message — detect job links and make them clickable
function MessageContent({ content }: { content: string }) {
  // Split on URLs like /jobs/... and make them links
  const parts = content.split(/(\/(jobs|login|register)[^\s)]*)/g);
  return (
    <span className="leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith("/jobs/") || part === "/login" || part.startsWith("/register")) {
          return (
            <Link
              key={i}
              href={part}
              className="underline text-accent hover:text-accent-hover font-medium"
              target={part.startsWith("/jobs/") ? "_blank" : undefined}
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

const QUICK_PROMPTS_GUEST = [
  "How do I sign up as a student?",
  "How does recruiter verification work?",
  "Show me available jobs",
  "What is PartJob?",
];

const QUICK_PROMPTS_STUDENT = [
  "Find me a job in Tunis",
  "Show me software internships",
  "Jobs paying over 50 DT/day",
  "How do I apply for a job?",
];

export function ChatBot() {
  const { data: session } = useSession();
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const role     = session?.user?.role;
  const isStudent = role === "STUDENT";
  const quickPrompts = isStudent ? QUICK_PROMPTS_STUDENT : QUICK_PROMPTS_GUEST;

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = session?.user
        ? `Hi ${session.user.name?.split(" ")[0]} 👋 I'm your PartJob assistant. I can help you find jobs, answer questions about applications, and more. What can I help you with?`
        : "Hi 👋 I'm the PartJob assistant! I can help you find jobs, explain how to sign up, or answer any questions. What would you like to know?";
      setMessages([{ role: "assistant", content: greeting }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg].slice(-10); // last 10 messages for context
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          userRole: session?.user?.role ?? "guest",
        }),
      });

      const data = await res.json();
      const reply = data.message ?? "Sorry, I couldn't process that. Please try again.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      // Badge if panel is closed
      if (!open) setUnread((n) => n + 1);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, messages, open, session]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 right-4 z-[300] w-[calc(100vw-2rem)] max-w-sm flex flex-col bg-surface border border-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
            style={{ maxHeight: "min(520px, calc(100dvh - 120px))" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-accent border-b border-accent/50 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white">PartJob Assistant</p>
                <p className="text-[11px] text-white/70">Powered by Llama 3 · Always here to help</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 overscroll-contain min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={clsx(
                  "flex gap-2 items-end",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0 mb-0.5">
                      <Bot className="w-3.5 h-3.5 text-accent" />
                    </div>
                  )}
                  <div className={clsx(
                    "px-3.5 py-2.5 rounded-2xl text-sm max-w-[82%] break-words",
                    msg.role === "user"
                      ? "bg-accent text-white rounded-br-sm ml-auto"
                      : "bg-surface-2 border border-border text-ink rounded-bl-sm"
                  )}>
                    {msg.role === "assistant"
                      ? <MessageContent content={msg.content} />
                      : msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 items-end">
                  <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="px-3.5 py-2.5 bg-surface-2 border border-border rounded-2xl rounded-bl-sm">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 rounded-full bg-ink-muted"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts — shown when few messages */}
            {messages.length <= 1 && !loading && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                {quickPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-[11px] px-2.5 py-1.5 bg-surface-2 border border-border rounded-full text-ink-muted hover:text-accent hover:border-accent/40 transition-colors flex items-center gap-1"
                  >
                    <ChevronRight className="w-3 h-3" />
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 border-t border-border shrink-0">
              <div className="flex items-end gap-2 bg-surface-2 border border-border rounded-xl px-3 py-2 focus-within:border-accent transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask me anything…"
                  rows={1}
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm text-ink placeholder-ink-faint outline-none resize-none max-h-24 overflow-y-auto disabled:opacity-50"
                  style={{ minHeight: "20px" }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className={clsx(
                    "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                    input.trim() && !loading
                      ? "bg-accent text-white hover:bg-accent-hover"
                      : "bg-surface-3 text-ink-faint cursor-not-allowed"
                  )}
                  aria-label="Send"
                >
                  {loading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trigger button ──────────────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        animate={open ? { scale: 1 } : { scale: [1, 1.05, 1] }}
        transition={open ? {} : { duration: 3, repeat: Infinity, repeatDelay: 5 }}
        className={clsx(
          "fixed bottom-4 right-4 z-[300]",
          "w-14 h-14 rounded-2xl shadow-2xl",
          "flex items-center justify-center",
          "transition-colors duration-200",
          open
            ? "bg-surface-2 border border-border text-ink-muted hover:text-ink"
            : "bg-accent text-white hover:bg-accent-hover shadow-accent/30"
        )}
        aria-label={open ? "Close chat" : "Open chat assistant"}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Briefcase className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-bg">
            {unread}
          </span>
        )}

        {/* Pulse ring when closed */}
        {!open && (
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl bg-accent/40 -z-10"
          />
        )}
      </motion.button>
    </>
  );
}
