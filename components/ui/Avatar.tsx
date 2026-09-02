import clsx from "clsx";

type Role = "STUDENT" | "RECRUITER" | "ADMIN";

interface AvatarProps {
  name: string;
  role: Role;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  xs: "w-6  h-6  text-[10px]",
  sm: "w-8  h-8  text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

const ICON_SIZES = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
  xl: "w-10 h-10",
};

// Role-specific color schemes
const ROLE_STYLES: Record<Role, { ring: string; bg: string; text: string }> = {
  STUDENT:   { ring: "ring-accent/30",  bg: "bg-accent/15",  text: "text-accent" },
  RECRUITER: { ring: "ring-emerald/30", bg: "bg-emerald/15", text: "text-emerald" },
  ADMIN:     { ring: "ring-amber/30",   bg: "bg-amber/15",   text: "text-amber" },
};

// Role-specific SVG illustrations as default avatars
function StudentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Graduation cap */}
      <circle cx="20" cy="14" r="5" fill="currentColor" opacity="0.9" />
      <path d="M20 8L8 13l12 5 12-5-12-5z" fill="currentColor" />
      <path d="M14 15v5c0 3.3 2.7 6 6 6s6-2.7 6-6v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M32 13v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="20" r="1.5" fill="currentColor" />
      {/* Body */}
      <path d="M11 33c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

function RecruiterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Briefcase */}
      <rect x="8" y="17" width="24" height="16" rx="3" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" />
      <path d="M15 17v-3a2 2 0 012-2h6a2 2 0 012 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M8 24h24" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <path d="M20 24v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Head */}
      <circle cx="20" cy="10" r="4" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

function AdminIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shield */}
      <path d="M20 5L9 10v8c0 6.6 4.7 12.8 11 14.3C26.3 30.8 31 24.6 31 18v-8L20 5z"
        fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* Star / checkmark inside */}
      <path d="M15 20l3.5 3.5L25 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Crown on head */}
      <circle cx="20" cy="9" r="2.5" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

const ROLE_ICONS: Record<Role, React.ComponentType<{ className?: string }>> = {
  STUDENT:   StudentIcon,
  RECRUITER: RecruiterIcon,
  ADMIN:     AdminIcon,
};

export function Avatar({ name, role, avatarUrl, size = "md", className }: AvatarProps) {
  const { ring, bg, text } = ROLE_STYLES[role];
  const Icon = ROLE_ICONS[role];
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={clsx(
        "rounded-full shrink-0 ring-2 overflow-hidden",
        "flex items-center justify-center",
        SIZES[size],
        ring,
        bg,
        className
      )}
      aria-label={`${name}'s avatar`}
      role="img"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className={clsx("flex items-center justify-center w-full h-full", text)}>
          {/* For large sizes show the illustrated icon, for small show initials */}
          {size === "lg" || size === "xl" ? (
            <Icon className={ICON_SIZES[size]} />
          ) : (
            <span className="font-bold leading-none select-none">{initials || "?"}</span>
          )}
        </div>
      )}
    </div>
  );
}
