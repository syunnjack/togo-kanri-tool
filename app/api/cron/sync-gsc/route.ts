import { NextRequest, NextResponse } from "next/server";
import { fetchSearchAnalyticsByDay } from "@/lib/gsc";
import { fetchGa4AnalyticsByDay } from "@/lib/ga4";
import {
  GA4_SUGGESTION_CATEGORIES,
  GSC_SUGGESTION_CATEGORIES,
  listGa4DailyForSite,
  listGscDailyForSite,
  listSites,
  logSync,
  replaceAutoSuggestions,
  setSiteGa4Connected,
  setSiteGscConnected,
  upsertGa4Daily,
  upsertGscDaily,
} from "@/lib/data";
import { computeGa4Suggestions, computeSuggestions } from "@/lib/suggestions";

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sites = (await listSites()).filter((s) => s.is_active);

  const endDate = toDateStr(new Date());
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - 30);
  const startDate = toDateStr(startDateObj);

  const results: { repo_name: string; gsc?: string; ga4?: string }[] = [];

  for (const site of sites) {
    const result: { repo_name: string; gsc?: string; ga4?: string } = { repo_name: site.repo_name };

    if (site.gsc_property) {
      try {
        const rows = await fetchSearchAnalyticsByDay(site.gsc_property, startDate, endDate);
        await upsertGscDaily(site.id, rows);
        await setSiteGscConnected(site.id, true);
        await logSync(site.id, "success");

        const recent = await listGscDailyForSite(site.id, 28);
        const suggestions = computeSuggestions(recent);
        await replaceAutoSuggestions(site.id, GSC_SUGGESTION_CATEGORIES, suggestions);
        result.gsc = "success";
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await setSiteGscConnected(site.id, false);
        await logSync(site.id, "error", message);
        await replaceAutoSuggestions(site.id, GSC_SUGGESTION_CATEGORIES, [
          {
            severity: "warning",
            category: "no_data",
            message: `Search Console APIの呼び出しに失敗しました: ${message}。サービスアカウントへの権限付与を確認してください。`,
          },
        ]);
        result.gsc = `error: ${message}`;
      }
    }

    if (site.ga4_property_id) {
      try {
        const rows = await fetchGa4AnalyticsByDay(site.ga4_property_id, startDate, endDate);
        await upsertGa4Daily(
          site.id,
          rows.map((r) => ({
            date: r.date,
            sessions: r.sessions,
            active_users: r.activeUsers,
            page_views: r.pageViews,
            engagement_rate: r.engagementRate,
          }))
        );
        await setSiteGa4Connected(site.id, true);

        const recent = await listGa4DailyForSite(site.id, 28);
        const suggestions = computeGa4Suggestions(recent);
        await replaceAutoSuggestions(site.id, GA4_SUGGESTION_CATEGORIES, suggestions);
        result.ga4 = "success";
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await setSiteGa4Connected(site.id, false);
        await replaceAutoSuggestions(site.id, GA4_SUGGESTION_CATEGORIES, [
          {
            severity: "warning",
            category: "no_ga4_data",
            message: `GA4 Data APIの呼び出しに失敗しました: ${message}。サービスアカウントへの権限付与を確認してください。`,
          },
        ]);
        result.ga4 = `error: ${message}`;
      }
    }

    results.push(result);
  }

  return NextResponse.json({ synced: results.length, results });
}
