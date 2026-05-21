"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("invalid email"),
});

export async function subscribe(formData: FormData) {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    redirect(
      `/subscribe?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "invalid email",
      )}`,
    );
  }

  const svc = createServiceClient();
  // Upsert by email. New rows get a fresh unsubscribe_token; existing rows
  // are flipped back to 'active' (re-subscription).
  const { error } = await svc.from("subscribers").upsert(
    { email: parsed.data.email, status: "active" },
    { onConflict: "email" },
  );

  if (error) {
    redirect(`/subscribe?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/subscribe?subscribed=1");
}
