import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card } from "@globalcloudr/canopy-ui";
import { cn } from "@globalcloudr/canopy-ui";
import type { CommunityCampaignSummary } from "@/lib/community-schema";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("pb-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-[2rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-[15px] leading-6 text-[var(--text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

/** @deprecated Use PageHeader instead */
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
    <PageHeader title={title} description={description} actions={actions} className={className} />
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
      className={cn("rounded-lg border border-[var(--app-surface-border)] bg-white shadow-none", className)}
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8ca0b3]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
        {value}
      </p>
      <p className="mt-2 text-[14px] leading-6 text-[var(--text-muted)]">{hint}</p>
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
        "rounded-lg border border-[var(--app-surface-border)] bg-white px-4 py-4 shadow-none",
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8ca0b3]">
        {label}
      </p>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-[1.75rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">
          {value}
        </p>
      </div>
      {hint ? <p className="mt-1 text-[13px] leading-5 text-[var(--text-muted)]">{hint}</p> : null}
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
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-white", className)}>
      <div className="flex items-baseline justify-between border-b border-[var(--app-divider)] pb-4">
        <div>
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--ink)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-[14px] leading-6 text-[var(--text-muted)]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="pt-1">{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--rule)] bg-[var(--surface-muted)] px-5 py-6">
      <p className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--ink)]">{title}</p>
      <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--text-muted)]">{body}</p>
      {action && (
        <a
          href={action.href}
          className="mt-3 inline-block text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          {action.label} →
        </a>
      )}
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
    <Badge className="border-[var(--rule)] bg-[var(--surface-muted)] text-[var(--text-muted)]">Not connected</Badge>
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

  return <Badge className="border-[#dbeafe] bg-[#eff6ff] text-[var(--accent)]">Draft</Badge>;
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

export function formatShortDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
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
