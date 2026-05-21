"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";

export async function confirmUnsubscribe(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) redirect("/unsubscribe/invalid");

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("subscribers")
    .update({ status: "unsubscribed" })
    .eq("unsubscribe_token", token)
    .select("email")
    .maybeSingle();

  if (error || !data) {
    redirect(`/unsubscribe/${token}?error=not-found`);
  }
  redirect(`/unsubscribe/${token}?done=1`);
}
