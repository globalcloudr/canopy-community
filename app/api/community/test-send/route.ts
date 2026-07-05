import { NextResponse } from "next/server";
import { sendTestCampaignEmail } from "@/lib/community-data";
import { CampaignMonitorApiError } from "@/lib/campaign-monitor";
import { requireWorkspaceAccess, toErrorResponse } from "@/lib/server-auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      workspaceId?: string;
      name?: string;
      subject?: string;
      fromName?: string;
      fromEmail?: string;
      replyTo?: string;
      listIds?: string[];
      htmlContent?: string;
      testEmail?: string;
    };

    const {
      workspaceId,
      name,
      subject,
      fromName,
      fromEmail,
      replyTo,
      listIds,
      htmlContent,
      testEmail,
    } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }
    if (!subject?.trim()) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }
    if (!fromName?.trim()) {
      return NextResponse.json({ error: "From name is required." }, { status: 400 });
    }
    if (!fromEmail?.trim()) {
      return NextResponse.json({ error: "From email is required." }, { status: 400 });
    }
    if (!replyTo?.trim()) {
      return NextResponse.json({ error: "Reply-to email is required." }, { status: 400 });
    }
    if (!listIds || listIds.length === 0) {
      return NextResponse.json({ error: "At least one mailing list must be selected." }, { status: 400 });
    }
    if (!htmlContent?.trim()) {
      return NextResponse.json({ error: "HTML content is required." }, { status: 400 });
    }
    if (!testEmail?.trim()) {
      return NextResponse.json({ error: "A test email address is required." }, { status: 400 });
    }
    if (!EMAIL_PATTERN.test(testEmail.trim())) {
      return NextResponse.json({ error: "Enter a valid email address for the test send." }, { status: 400 });
    }

    await requireWorkspaceAccess(request, workspaceId);

    await sendTestCampaignEmail({
      workspaceId,
      name: name?.trim() || subject.trim(),
      subject: subject.trim(),
      fromName: fromName.trim(),
      fromEmail: fromEmail.trim(),
      replyTo: replyTo.trim(),
      listIds,
      htmlContent,
      testEmails: [testEmail.trim()],
    });

    return NextResponse.json({ sent: true, testEmail: testEmail.trim() });
  } catch (error) {
    if (error instanceof CampaignMonitorApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status >= 400 && error.status < 500 ? error.status : 400 }
      );
    }

    if (error instanceof Error) {
      const userSafeMessages = new Set([
        "No Campaign Monitor connection found for this workspace.",
        "Campaign Monitor API key is not configured.",
      ]);

      if (userSafeMessages.has(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return toErrorResponse(error, "Failed to send the test email.");
  }
}
