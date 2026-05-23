import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { validateInviteToken } from "@/lib/invite";
import { signUpload } from "@/lib/cloudinary";

const kindSchema = z.enum(["video", "image"]).default("video");

const bodySchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("admin"), kind: kindSchema }),
  z.object({
    role: z.literal("qr"),
    inviteToken: z.string().min(1),
    kind: kindSchema,
  }),
  z.object({ role: z.literal("request"), kind: kindSchema }),
]);

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const kind = parsed.kind;
  const bucket = kind === "image" ? "images" : "videos";
  let folder: string;

  if (parsed.role === "admin") {
    const ctx = await getCurrentAdmin();
    if (!ctx) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    folder = `${bucket}/admin`;
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
    const signed = signUpload(folder, kind);
    return NextResponse.json(signed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
