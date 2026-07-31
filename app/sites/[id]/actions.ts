"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function updateSiteSettings(siteId: string, formData: FormData) {
  const domain = String(formData.get("domain") ?? "").trim() || null;
  const gscProperty = String(formData.get("gsc_property") ?? "").trim() || null;
  const ga4PropertyId = String(formData.get("ga4_property_id") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const isActive = formData.get("is_active") === "on";

  const supabase = createServiceRoleClient();
  await supabase
    .from("tk_sites")
    .update({ domain, gsc_property: gscProperty, ga4_property_id: ga4PropertyId, category, is_active: isActive })
    .eq("id", siteId);

  revalidatePath(`/sites/${siteId}`);
  revalidatePath("/");
}
