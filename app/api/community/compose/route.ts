import { NextResponse } from "next/server";
import { composeCampaign } from "@/lib/community-data";
import { requireWorkspaceAccess, toErrorResponse } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      workspaceId?: string;
      name?: string;
      subject?: string;
      fromName?: string;
      fromEmail?: string;
      replyTo?: string;
      listId?: string;
      htmlContent?: string;
      scheduledDate?: string | null;
      confirmationEmail?: string;
    };

    const {
      workspaceId,
      name,
      subject,
      fromName,
      fromEmail,
      replyTo,
      listId,
      htmlContent,
      scheduledDate,
      confirmationEmail,
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
    if (!listId?.trim()) {
      return NextResponse.json({ error: "A mailing list must be selected." }, { status: 400 });
    }
    if (!htmlContent?.trim()) {
      return NextResponse.json({ error: "HTML content is required." }, { status: 400 });
    }
    if (!confirmationEmail?.trim()) {
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
      listId: listId.trim(),
      htmlContent,
      scheduledDate: scheduledDate ?? null,
      confirmationEmail: confirmationEmail.trim(),
    });

    return NextResponse.json({ campaignId: result.campaignId });
  } catch (error) {
    return toErrorResponse(error, "Failed to send campaign.");
  }
}
