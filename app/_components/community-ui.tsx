import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card } from "@canopy/ui";
import { cn } from "@canopy/ui";
import type { CommunityCampaignSummary } from "@/lib/community-schema";

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[32px] border border-[var(--app-surface-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] px-6 py-6 sm:px-7 sm:py-7",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.08),transparent_52%)]" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0f766e]">
            {eyebrow}
          </p>
          <h1 className="mt-2 max-w-[14ch] text-[2.1rem] font-semibold tracking-[-0.05em] text-[#0f172a] sm:text-[2.6rem]">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#526072] sm:text-[16px]">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3 lg:justify-end">{actions}</div> : null}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint: string;
  className?: string;
}) {
  return (
    <Card
      padding="md"
      className={cn("rounded-[26px] border border-[var(--app-surface-border)] bg-white shadow-none", className)}
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8ca0b3]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#0f172a]">
        {value}
      </p>
      <p className="mt-2 text-[14px] leading-6 text-[#617284]">{hint}</p>
    </Card>
  );
}

export function MiniStat({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-[var(--app-surface-border)] bg-white px-4 py-4 shadow-none",
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8ca0b3]">
        {label}
      </p>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-[1.75rem] font-semibold tracking-[-0.05em] text-[#0f172a]">
          {value}
        </p>
      </div>
      {hint ? <p className="mt-1 text-[13px] leading-5 text-[#617284]">{hint}</p> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
  action,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card
      padding="md"
      className={cn("rounded-[28px] border border-[var(--app-surface-border)] bg-white shadow-none", className)}
    >
      <div className="flex flex-col gap-3 border-b border-[var(--app-divider)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[1.25rem] font-semibold tracking-[-0.03em] text-[#0f172a]">
            {title}
          </h2>
          <p className="mt-1 text-[14px] leading-6 text-[#617284]">{description}</p>
        </div>
        {action}
      </div>
      <div className="pt-5">{children}</div>
    </Card>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#c7d4e4] bg-[#f7fafc] px-5 py-6">
      <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#0f172a]">{title}</p>
      <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#617284]">{body}</p>
    </div>
  );
}

export function SyncErrorNotice({
  message,
}: {
  message: string | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <Alert variant="warning">
      <AlertTitle>We could not refresh your newsletter data</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function ConnectionBadge({
  connected,
}: {
  connected: boolean;
}) {
  return connected ? (
    <Badge className="border-[#bfdbd5] bg-[#ecfdf5] text-[#0f766e]">Connected</Badge>
  ) : (
    <Badge className="border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">Not connected</Badge>
  );
}

export function CampaignStatusBadge({
  status,
}: {
  status: CommunityCampaignSummary["status"];
}) {
  if (status === "sent") {
    return <Badge className="border-[#bfdbd5] bg-[#ecfdf5] text-[#0f766e]">Sent</Badge>;
  }

  if (status === "scheduled") {
    return <Badge className="border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]">Scheduled</Badge>;
  }

  return <Badge className="border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8]">Draft</Badge>;
}

export function SecondaryButtonLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Button asChild variant="secondary">
      <a href={href}>{label}</a>
    </Button>
  );
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatCompactDateTime(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
