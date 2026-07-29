import { createServiceRoleClient } from "@/lib/supabase/server";
import type { GscDaily, Site, Suggestion } from "@/lib/types";

export async function listSites(): Promise<Site[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("tk_sites").select("*").order("display_name");
  return data ?? [];
}

export async function getSiteById(id: string): Promise<Site | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("tk_sites").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getSiteByRepoName(repoName: string): Promise<Site | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("tk_sites").select("*").eq("repo_name", repoName).maybeSingle();
  return data;
}

/** Daily GSC rows for a set of sites within the last `days` days, oldest first. */
export async function listGscDailyForSites(siteIds: string[], days: number): Promise<GscDaily[]> {
  if (siteIds.length === 0) return [];
  const supabase = createServiceRoleClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("tk_gsc_daily")
    .select("*")
    .in("site_id", siteIds)
    .gte("date", sinceStr)
    .order("date", { ascending: true });
  return data ?? [];
}

export async function listGscDailyForSite(siteId: string, days: number): Promise<GscDaily[]> {
  return listGscDailyForSites([siteId], days);
}

export async function upsertGscDaily(siteId: string, rows: { date: string; clicks: number; impressions: number; ctr: number; position: number }[]) {
  if (rows.length === 0) return;
  const supabase = createServiceRoleClient();
  await supabase.from("tk_gsc_daily").upsert(
    rows.map((r) => ({ site_id: siteId, ...r })),
    { onConflict: "site_id,date" }
  );
}

export async function logSync(siteId: string, status: "success" | "error", errorMessage?: string) {
  const supabase = createServiceRoleClient();
  await supabase.from("tk_sync_log").insert({ site_id: siteId, status, error_message: errorMessage ?? null });
}

export async function setSiteGscConnected(siteId: string, connected: boolean) {
  const supabase = createServiceRoleClient();
  await supabase.from("tk_sites").update({ gsc_connected: connected }).eq("id", siteId);
}

const AUTO_SUGGESTION_CATEGORIES = ["low_ctr", "traffic_decline", "position_drop", "growth", "no_data"];

export async function replaceAutoSuggestions(
  siteId: string,
  suggestions: { severity: Suggestion["severity"]; category: string; message: string }[]
) {
  const supabase = createServiceRoleClient();
  await supabase
    .from("tk_suggestions")
    .delete()
    .eq("site_id", siteId)
    .in("category", AUTO_SUGGESTION_CATEGORIES)
    .eq("is_resolved", false);
  if (suggestions.length > 0) {
    await supabase.from("tk_suggestions").insert(suggestions.map((s) => ({ site_id: siteId, ...s })));
  }
}

export async function listActiveSuggestions(): Promise<Suggestion[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("tk_suggestions")
    .select("*")
    .eq("is_resolved", false)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listActiveSuggestionsForSite(siteId: string): Promise<Suggestion[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("tk_suggestions")
    .select("*")
    .eq("site_id", siteId)
    .eq("is_resolved", false)
    .order("created_at", { ascending: false });
  return data ?? [];
}
