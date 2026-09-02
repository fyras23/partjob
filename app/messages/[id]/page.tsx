"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import clsx from "clsx";

interface MsgUser {
  id: string; name: string; avatarUrl: string | null;
}
interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  sender: MsgUser | null;
}
interface ConvDetail {
  id: string;
  recruiterUserId: string;
  studentUserId: string;
  otherUser: MsgUser | null;
  application: {
    post: { title: string; type: string } | null;
  } | null;
}

export default function ChatPage() {
  const { id: convId }    = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router            = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conv,     setConv]     = useState<ConvDetail | null>(null);
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const userId = session?.user?.id;
  const role   = (session?.user?.role ?? "STUDENT") as "STUDENT" | "RECRUITER" | "ADMIN";

  /* ── Load messages + conv metadata ──────────────────────────────── */
  const loadAll = useCallback(async () => {
    const [msgRes, convRes] = await Promise.all([
      fetch(`/api/conversations/${convId}/messages`),
      fetch(`/api/conversations`),
    ]);

    if (msgRes.ok) {
      const msgs = await msgRes.json();
      if (Array.isArray(msgs)) setMessages(msgs);
    }
    if (convRes.ok) {
      const convs = await convRes.json();
      if (Array.isArray(convs)) {
        const found = convs.find((c: ConvDetail) => c.id === convId);
        if (found) setConv(found);
      }
    }
    setLoading(false);
  }, [convId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── SSE — real-time ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!userId) return;
    const es = new EventSource("/api/notifications/stream");
    es.onmessage = (e) => {
      try {
        const p = JSON.parse(e.data);
        if (p.type === "NEW_MESSAGE" && p.conversationId === convId) {
          fetch(`/api/conversations/${convId}/messages`)
            .then((r) => r.json())
            .then((d) => { if (Array.isArray(d)) setMessages(d); });
        }
      } catch { /* SSE comment */ }
    };
    return () => es.close();
  }, [userId, convId]);

  /* ── Scroll to bottom ────────────────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send ────────────────────────────────────────────────────────── */
  async function sendMessage() {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");

    const res = await fetch(`/api/conversations/${convId}/messages`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ content }),
    });
    if (res.ok) {
      const newMsg = await res.json();
      setMessages((prev) => [...prev, newMsg]);
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 py-20">
      <Loader2 className="w-6 h-6 text-accent animate-spin" />
      <p className="text-sm text-ink-muted">Loading…</p>
    </div>
  );

  const otherUser = conv?.otherUser ?? null;
  const otherRole = role === "RECRUITER" ? "STUDENT" : "RECRUITER";

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 0px)" }}>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3.5 bg-surface border-b border-border shrink-0">
        <button
          onClick={() => router.push("/messages")}
          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {otherUser && (
          <Avatar
            name={otherUser.name}
            role={otherRole as "STUDENT" | "RECRUITER" | "ADMIN"}
            avatarUrl={otherUser.avatarUrl}
            size="sm"
          />
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-ink truncate">
            {otherUser?.name ?? "Conversation"}
          </p>
          {conv?.application?.post?.title && (
            <p className="text-xs text-ink-muted truncate">
              {conv.application.post.title}
            </p>
          )}
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 overscroll-contain">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-3">
              <Send className="w-6 h-6 text-ink-faint" />
            </div>
            <p className="text-sm font-medium text-ink-muted">No messages yet</p>
            <p className="text-xs text-ink-faint mt-1">Send the first message.</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.senderId === userId;
          const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
          const time = new Date(msg.createdAt).toLocaleTimeString("en-GB", {
            hour: "2-digit", minute: "2-digit",
          });

          return (
            <div key={msg.id} className={clsx(
              "flex items-end gap-2",
              isMe ? "flex-row-reverse" : "flex-row"
            )}>
              {!isMe ? (
                showAvatar && otherUser
                  ? <Avatar
                      name={otherUser.name}
                      role={otherRole as "STUDENT" | "RECRUITER" | "ADMIN"}
                      avatarUrl={otherUser.avatarUrl}
                      size="xs"
                      className="mb-0.5 shrink-0"
                    />
                  : <div className="w-6 shrink-0" />
              ) : null}

              <div className={clsx("flex flex-col gap-0.5 max-w-[72%]", isMe && "items-end")}>
                <div className={clsx(
                  "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
                  isMe
                    ? "bg-accent text-white rounded-br-sm"
                    : "bg-surface-2 border border-border text-ink rounded-bl-sm"
                )}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-ink-faint px-1">{time}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 bg-surface border-t border-border">
        <div className="flex items-end gap-2 bg-surface-2 border border-border rounded-2xl px-3 py-2 focus-within:border-accent transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-ink placeholder-ink-faint outline-none resize-none max-h-32 overflow-y-auto"
            style={{ minHeight: "24px" }}
            aria-label="Message input"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            aria-label="Send"
            className={clsx(
              "shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !sending
                ? "bg-accent text-white hover:bg-accent-hover"
                : "bg-surface-3 text-ink-faint cursor-not-allowed"
            )}
          >
            {sending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-ink-faint mt-1 px-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
