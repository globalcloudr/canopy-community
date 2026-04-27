"use client";

import Link from "next/link";
import { BodyText, Button, Card, CardTitle } from "@globalcloudr/canopy-ui";
import { ProductShell } from "@/app/_components/product-shell";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-[1.4rem] font-bold tracking-[-0.02em] text-[var(--foreground)]">{title}</h2>
      {children}
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[13px] font-bold text-white">
        {number}
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="font-semibold text-[var(--foreground)]">{title}</p>
        <BodyText muted className="mt-1 text-[14px]">{description}</BodyText>
      </div>
    </div>
  );
}

function Faq({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="py-4">
      <p className="font-semibold text-[var(--foreground)]">{question}</p>
      <BodyText muted className="mt-1.5 text-[14px]">{answer}</BodyText>
    </div>
  );
}

export default function HelpPage() {
  return (
    <ProductShell activeNav="help">
      <div className="mx-auto max-w-3xl space-y-10">

        <div className="border-b border-[var(--border)] pb-6">
          <p className="text-[0.8rem] font-semibold uppercase tracking-widest text-[var(--accent)]">Help</p>
          <h1 className="mt-1 text-[2rem] font-bold tracking-[-0.02em] text-[var(--foreground)]">User guide</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">Learn how to create and send newsletters to your school's mailing lists</p>
        </div>

        <Section title="How Canopy Community works">
          <Card padding="md" className="border border-[var(--rule)] bg-transparent shadow-none sm:p-8">
            <BodyText className="mb-6 text-[15px]">
              Canopy Community connects to your Campaign Monitor account so your team can create, send,
              and track school newsletters — without logging into Campaign Monitor directly.
            </BodyText>
            <div className="space-y-5">
              <Step number={1} title="Connect Campaign Monitor" description="Add your Campaign Monitor Client ID in Settings. This links Community to your school's subscriber lists and sending history." />
              <Step number={2} title="Create a newsletter" description="Open New Campaign, give it an internal name, and choose a template or build from scratch using the email editor. You can also upload your own HTML." />
              <Step number={3} title="Select your audience" description="Pick one or more subscriber lists from your Campaign Monitor account. Community shows the list names and subscriber counts so you can send to the right people." />
              <Step number={4} title="Review and send" description="Check the estimated recipient count and billing confirmation, then send immediately or schedule for a specific date and time." />
              <Step number={5} title="Track performance" description="After sending, click any campaign in the Campaigns view to see open rate, click rate, bounces, unsubscribes, and top-clicked links." />
            </div>
          </Card>
        </Section>

        <Section title="Getting started">
          <Card padding="md" className="border border-[var(--rule)] bg-transparent shadow-none sm:p-8">
            <div className="space-y-6">
              <div>
                <CardTitle className="text-base">1. Connect your Campaign Monitor account</CardTitle>
                <BodyText muted className="mt-2 text-[14px]">
                  Go to <Link href="/settings" className="underline underline-offset-2">Settings</Link> and
                  enter your Campaign Monitor Client ID. Your Canopy administrator has the master API key —
                  you only need the Client ID specific to your school.
                </BodyText>
              </div>
              <div>
                <CardTitle className="text-base">2. Save a reusable template</CardTitle>
                <BodyText muted className="mt-2 text-[14px]">
                  Build your school newsletter layout once in{" "}
                  <Link href="/templates" className="underline underline-offset-2">Templates</Link> and
                  reuse it every time. Templates save your header, footer, colors, and layout so each
                  new campaign starts from a consistent base.
                </BodyText>
              </div>
              <div>
                <CardTitle className="text-base">3. Send your first campaign</CardTitle>
                <BodyText muted className="mt-2 text-[14px]">
                  Open <Link href="/compose" className="underline underline-offset-2">New Campaign</Link>,
                  load your template, fill in the content, select your list, and send. Drafts are saved
                  automatically and can be resumed from the Campaigns page.
                </BodyText>
              </div>
            </div>
          </Card>
        </Section>

        <Section title="Frequently asked questions">
          <Card padding="md" className="border border-[var(--rule)] bg-transparent shadow-none sm:p-8">
            <div className="divide-y divide-[var(--border)]">
              <Faq
                question="What is Campaign Monitor and why do I need it?"
                answer="Campaign Monitor is the email delivery platform that powers your school's newsletters. Canopy Community is the interface your team uses to create and send newsletters — Campaign Monitor handles the actual delivery and subscriber management."
              />
              <Faq
                question="How do I find my Campaign Monitor Client ID?"
                answer="Log into Campaign Monitor, go to your account settings, and find the client for your school. The Client ID is shown in the client details. Your Canopy administrator can also look this up for you."
              />
              <Faq
                question="Can I manage subscriber lists from Community?"
                answer="Community shows your existing Campaign Monitor lists so you can select them when sending. To add or remove subscribers, manage list settings, or create new lists, use Campaign Monitor directly."
              />
              <Faq
                question="What does the estimated cost shown before sending mean?"
                answer="Campaign Monitor charges per email sent based on your plan. Community shows the estimated recipient count so you can confirm before sending. The actual charge is billed through your Campaign Monitor account."
              />
              <Faq
                question="Can I save a draft and finish it later?"
                answer="Yes. Drafts are saved automatically as you work. Open the Campaigns page and look for the Continue link next to any unfinished draft to pick up where you left off."
              />
              <Faq
                question="Why don't I see any subscriber lists?"
                answer="This usually means the Campaign Monitor connection isn't set up yet, or the Client ID saved in Settings doesn't match an active client. Check Settings and confirm the Client ID is correct."
              />
            </div>
          </Card>
        </Section>

        <Section title="Quick links">
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary"><Link href="/">Dashboard</Link></Button>
            <Button asChild variant="secondary"><Link href="/compose">New Campaign</Link></Button>
            <Button asChild variant="secondary"><Link href="/campaigns">Campaigns</Link></Button>
            <Button asChild variant="secondary"><Link href="/settings">Settings</Link></Button>
            <Button asChild variant="secondary">
              <a href="mailto:info@akkedisdigital.com?subject=Canopy%20Community%20Support">Contact support</a>
            </Button>
          </div>
        </Section>

      </div>
    </ProductShell>
  );
}
