import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { validateInviteToken } from "@/lib/invite";
import { signUpload } from "@/lib/cloudinary";

const bodySchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("admin") }),
  z.object({ role: z.literal("qr"), inviteToken: z.string().min(1) }),
  z.object({ role: z.literal("request") }),
]);

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  let folder: string;

  if (parsed.role === "admin") {
    const ctx = await getCurrentAdmin();
    if (!ctx) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    folder = `videos/admin`;
  } else if (parsed.role === "qr") {
    const invite = await validateInviteToken(parsed.inviteToken);
    if (!invite) {
      return NextResponse.json(
        { error: "invalid or revoked invite" },
        { status: 401 },
      );
    }
    folder = `pending/qr/${invite.id}`;
  } else {
    // Public anonymous request flow. Folder is shared; admin reviews + moves
    // approved assets out of it.
    folder = `pending/requests`;
  }

  try {
    const signed = signUpload(folder);
    return NextResponse.json(signed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
