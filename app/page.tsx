import Link from "next/link";
import { listActiveSuggestions, listGa4DailyForSites, listGscDailyForSites, listSites } from "@/lib/data";
import { groupBySiteId, summarizeGa4Rows, summarizeRows } from "@/lib/metrics";

export const dynamic = "force-dynamic";

function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-slate-400">—</span>;
  const positive = pct >= 0;
  return (
    <span className={positive ? "text-emerald-600" : "text-red-600"}>
      {positive ? "+" : ""}
      {(pct * 100).toFixed(0)}%
    </span>
  );
}

export default async function Home() {
  const sites = await listSites();
  const siteIds = sites.map((s) => s.id);
  const gscRows = await listGscDailyForSites(siteIds, 14);
  const ga4Rows = await listGa4DailyForSites(siteIds, 14);
  const gscBySite = groupBySiteId(gscRows);
  const ga4BySite = groupBySiteId(ga4Rows);

  const suggestions = await listActiveSuggestions();
  const suggestionCountBySite = new Map<string, { critical: number; warning: number; info: number }>();
  for (const s of suggestions) {
    const entry = suggestionCountBySite.get(s.site_id) ?? { critical: 0, warning: 0, info: 0 };
    entry[s.severity] += 1;
    suggestionCountBySite.set(s.site_id, entry);
  }

  const rows = sites.map((site) => ({
    site,
    summary: summarizeRows(gscBySite.get(site.id) ?? []),
    ga4Summary: summarizeGa4Rows(ga4BySite.get(site.id) ?? []),
    suggestionCounts: suggestionCountBySite.get(site.id) ?? { critical: 0, warning: 0, info: 0 },
  }));

  rows.sort((a, b) => b.ga4Summary.pageViewsLast7 - a.ga4Summary.pageViewsLast7 || b.summary.clicksLast7 - a.summary.clicksLast7);

  const totalCritical = suggestions.filter((s) => s.severity === "critical").length;
  const totalWarning = suggestions.filter((s) => s.severity === "warning").length;
  const gscConnectedCount = sites.filter((s) => s.gsc_connected).length;
  const ga4ConnectedCount = sites.filter((s) => s.ga4_connected).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">サイト横断ダッシュボード</h1>
      <p className="mt-1 text-sm text-slate-600">
        {sites.length}サイト中 GSC連携 {gscConnectedCount}件・GA4連携 {ga4ConnectedCount}件
      </p>

      <div className="mt-4 flex gap-3">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs text-red-700">重大な改善提案</p>
          <p className="text-xl font-bold text-red-700">{totalCritical}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs text-amber-700">要注意な改善提案</p>
          <p className="text-xl font-bold text-amber-700">{totalWarning}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">サイト</th>
              <th className="px-3 py-2 text-right">PV(7d)</th>
              <th className="px-3 py-2 text-right">前週比</th>
              <th className="px-3 py-2 text-right">クリック(7d)</th>
              <th className="px-3 py-2 text-right">前週比</th>
              <th className="px-3 py-2 text-right">表示回数(7d)</th>
              <th className="px-3 py-2 text-right">CTR</th>
              <th className="px-3 py-2 text-right">平均順位</th>
              <th className="px-3 py-2 text-right">提案</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ site, summary, ga4Summary, suggestionCounts }) => (
              <tr key={site.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/sites/${site.id}`} className="font-medium text-blue-600">
                    {site.display_name}
                  </Link>
                  <div className="mt-0.5 flex gap-1 text-xs text-slate-400">
                    {!site.gsc_connected && <span>GSC未連携</span>}
                    {!site.ga4_connected && <span>GA4未連携</span>}
                  </div>
                </td>
                <td className="px-3 py-2 text-right">{ga4Summary.pageViewsLast7}</td>
                <td className="px-3 py-2 text-right">
                  <ChangeBadge pct={ga4Summary.pageViewsChangePct} />
                </td>
                <td className="px-3 py-2 text-right">{summary.clicksLast7}</td>
                <td className="px-3 py-2 text-right">
                  <ChangeBadge pct={summary.clicksChangePct} />
                </td>
                <td className="px-3 py-2 text-right">{summary.impressionsLast7}</td>
                <td className="px-3 py-2 text-right">{(summary.ctrLast7 * 100).toFixed(2)}%</td>
                <td className="px-3 py-2 text-right">{summary.positionLast7 > 0 ? summary.positionLast7.toFixed(1) : "—"}</td>
                <td className="px-3 py-2 text-right">
                  {suggestionCounts.critical > 0 && (
                    <span className="mr-1 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                      {suggestionCounts.critical}
                    </span>
                  )}
                  {suggestionCounts.warning > 0 && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                      {suggestionCounts.warning}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                  サイトが登録されていません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
