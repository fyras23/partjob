"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import clsx from "clsx";

interface ConvUser {
  id: string; name: string; avatarUrl: string | null;
}
interface LastMessage {
  content: string; createdAt: string; senderId: string;
}
interface Conversation {
  id: string;
  recruiterUserId: string;
  studentUserId: string;
  otherUser: ConvUser | null;
  unreadCount: number;
  createdAt: string;
  lastMessage: LastMessage | null;
  application: {
    post: { title: string; type: string } | null;
    student: { user: { id: string; name: string; avatarUrl: string | null } } | null;
  } | null;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [convs, setConvs]   = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => { setConvs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const role = (session?.user?.role ?? "STUDENT") as "STUDENT" | "RECRUITER" | "ADMIN";

  if (loading) return (
    <div className="flex flex-col gap-3 p-6 max-w-2xl mx-auto w-full">
      {[1,2,3].map((i) => (
        <div key={i} className="h-20 bg-surface border border-border rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full px-4 py-6">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-semibold text-ink">Messages</h1>
        <p className="text-ink-muted text-sm mt-1">
          {role === "RECRUITER"
            ? "Conversations with candidates you approved."
            : "Conversations with recruiters who accepted you."}
        </p>
      </div>

      {convs.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description={
            role === "RECRUITER"
              ? "When you approve a candidate, a conversation thread opens here."
              : "When a recruiter approves your application, a conversation thread opens here."
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {convs.map((c) => {
            const lastMsg  = c.lastMessage;
            const lastText = lastMsg
              ? (lastMsg.senderId === session?.user?.id ? "You: " : "") + lastMsg.content.slice(0, 60)
              : "No messages yet";
            const lastTime = lastMsg
              ? new Date(lastMsg.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
              : "";

            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3.5 bg-surface border rounded-2xl",
                    "hover:border-accent/40 transition-colors",
                    c.unreadCount > 0 ? "border-accent/30 bg-accent/5" : "border-border"
                  )}
                >
                  <Avatar
                    name={c.otherUser?.name ?? "?"}
                    role={role === "RECRUITER" ? "STUDENT" : "RECRUITER"}
                    avatarUrl={c.otherUser?.avatarUrl ?? null}
                    size="md"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-ink truncate">
                        {c.otherUser?.name ?? "Unknown"}
                      </p>
                      <span className="text-[11px] text-ink-faint shrink-0">{lastTime}</span>
                    </div>
                    <p className="text-xs text-ink-muted truncate mt-0.5">
                      {c.application?.post?.title ?? ""}
                    </p>
                    <p className={clsx(
                      "text-xs truncate mt-0.5",
                      c.unreadCount > 0 ? "text-ink font-medium" : "text-ink-faint"
                    )}>
                      {lastText}
                    </p>
                  </div>

                  {c.unreadCount > 0 && (
                    <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-accent text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                      {c.unreadCount > 9 ? "9+" : c.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
