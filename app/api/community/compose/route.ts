import { NextResponse } from "next/server";
import { composeCampaign } from "@/lib/community-data";
import { CampaignMonitorApiError } from "@/lib/campaign-monitor";
import { requireWorkspaceAccess, toErrorResponse } from "@/lib/server-auth";

export async function POST(request: Request) {
  let isDraft = false;

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
      scheduledDate?: string | null;
      confirmationEmail?: string;
      draft?: boolean;
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
      scheduledDate,
      confirmationEmail,
      draft,
    } = body;

    isDraft = body.draft === true;

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
    if (!draft && !confirmationEmail?.trim()) {
      return NextResponse.json({ error: "Confirmation email is required." }, { status: 400 });
    }

    const { user } = await requireWorkspaceAccess(request, workspaceId);

    const result = await composeCampaign({
      workspaceId,
      name: name?.trim() || subject.trim(),
      subject: subject.trim(),
      fromName: fromName.trim(),
      fromEmail: fromEmail.trim(),
      replyTo: replyTo.trim(),
      listIds,
      htmlContent,
      scheduledDate: scheduledDate ?? null,
      confirmationEmail: confirmationEmail?.trim() ?? "",
      draft: isDraft,
    });

    return NextResponse.json({ campaignId: result.campaignId });
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

    return toErrorResponse(error, isDraft ? "Failed to save draft." : "Failed to send campaign.");
  }
}
