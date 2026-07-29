import { NextRequest, NextResponse } from "next/server";
import { fetchSearchAnalyticsByDay } from "@/lib/gsc";
import {
  listGscDailyForSite,
  listSites,
  logSync,
  replaceAutoSuggestions,
  setSiteGscConnected,
  upsertGscDaily,
} from "@/lib/data";
import { computeSuggestions } from "@/lib/suggestions";

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sites = (await listSites()).filter((s) => s.is_active && s.gsc_property);

  const endDate = toDateStr(new Date());
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - 30);
  const startDate = toDateStr(startDateObj);

  const results: { repo_name: string; status: string; error?: string }[] = [];

  for (const site of sites) {
    try {
      const rows = await fetchSearchAnalyticsByDay(site.gsc_property!, startDate, endDate);
      await upsertGscDaily(site.id, rows);
      await setSiteGscConnected(site.id, true);
      await logSync(site.id, "success");

      const recent = await listGscDailyForSite(site.id, 28);
      const suggestions = computeSuggestions(recent);
      await replaceAutoSuggestions(site.id, suggestions);

      results.push({ repo_name: site.repo_name, status: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await setSiteGscConnected(site.id, false);
      await logSync(site.id, "error", message);
      await replaceAutoSuggestions(site.id, [
        {
          severity: "warning",
          category: "no_data",
          message: `Search Console APIの呼び出しに失敗しました: ${message}。サービスアカウントへの権限付与を確認してください。`,
        },
      ]);
      results.push({ repo_name: site.repo_name, status: "error", error: message });
    }
  }

  return NextResponse.json({ synced: results.length, results });
}
