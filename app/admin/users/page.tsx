"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { RoleBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "RECRUITER" | "ADMIN";
  createdAt: string;
  recruiterProfile?: { verificationStatus: "PENDING" | "APPROVED" | "REJECTED" } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aggregate users from the recruiters list as a proxy — a dedicated /api/admin/users
    // endpoint can be added later. For now pull from recruiters + students would need a
    // separate endpoint. We show what the API supports.
    fetch("/api/admin/recruiters")
      .then((r) => r.json())
      .then((data: { id: string; user: { id: string; name: string; email: string; createdAt: string }; verificationStatus: "PENDING" | "APPROVED" | "REJECTED" }[]) => {
        const mapped: User[] = Array.isArray(data)
          ? data.map((r) => ({
              id: r.user.id,
              name: r.user.name,
              email: r.user.email,
              role: "RECRUITER" as const,
              createdAt: r.user.createdAt,
              recruiterProfile: { verificationStatus: r.verificationStatus },
            }))
          : [];
        setUsers(mapped);
        setFiltered(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
        : users
    );
  }, [search, users]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-3xl font-medium text-ink">Users</h1>
        <p className="text-ink-muted mt-1 text-sm">Searchable overview of registered users.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-[2px] text-ink placeholder-ink-muted outline-none focus:border-accent"
          aria-label="Search users"
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-surface border border-border rounded-[4px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No users found"
          description={search ? "Try a different search term." : "No users are registered yet."}
          action={search ? { label: "Clear search", onClick: () => setSearch("") } : undefined}
        />
      ) : (
        <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-border bg-bg text-xs font-medium text-ink-muted uppercase tracking-wide">
            <span className="col-span-4">Name</span>
            <span className="col-span-4">Email</span>
            <span className="col-span-2">Role</span>
            <span className="col-span-2">Status</span>
          </div>

          {filtered.map((u, idx) => {
            const date = new Date(u.createdAt).toLocaleDateString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
            });
            return (
              <div
                key={u.id}
                className={`grid grid-cols-12 gap-4 px-4 py-3 items-center text-sm ${
                  idx < filtered.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="col-span-4 min-w-0">
                  <p className="font-medium text-ink truncate">{u.name}</p>
                  <p className="text-xs text-ink-muted">{date}</p>
                </div>
                <p className="col-span-4 text-ink-muted truncate text-xs">{u.email}</p>
                <div className="col-span-2">
                  <RoleBadge role={u.role} />
                </div>
                <div className="col-span-2">
                  {u.recruiterProfile ? (
                    <StatusBadge status={u.recruiterProfile.verificationStatus} />
                  ) : (
                    <span className="text-xs text-ink-muted">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
