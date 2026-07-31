import { notFound } from "next/navigation";
import { getServiceAccountEmail } from "@/lib/gsc";
import { getSiteById, listActiveSuggestionsForSite, listGa4DailyForSite, listGscDailyForSite } from "@/lib/data";
import { ClicksChart, CtrPositionChart, Ga4Chart } from "./charts";
import { updateSiteSettings } from "./actions";

const SEVERITY_LABEL: Record<string, string> = {
  critical: "重大",
  warning: "要注意",
  info: "情報",
};

const SEVERITY_CLASS: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await getSiteById(id);
  if (!site) notFound();

  const gscRows = await listGscDailyForSite(id, 90);
  const ga4Rows = await listGa4DailyForSite(id, 90);
  const suggestions = await listActiveSuggestionsForSite(id);
  const serviceAccountEmail = getServiceAccountEmail();

  const boundUpdate = updateSiteSettings.bind(null, id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">{site.display_name}</h1>
      <div className="mt-1 flex gap-3 text-sm text-slate-500">
        {site.github_url && (
          <a href={site.github_url} target="_blank" rel="noreferrer" className="underline">
            GitHub
          </a>
        )}
        {site.domain && (
          <a href={`https://${site.domain}`} target="_blank" rel="noreferrer" className="underline">
            {site.domain}
          </a>
        )}
        <span>{site.gsc_connected ? "GSC連携済み" : "GSC未連携"}</span>
        <span>{site.ga4_connected ? "GA4連携済み" : "GA4未連携"}</span>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-slate-900">改善提案</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {suggestions.map((s) => (
              <li key={s.id} className={`rounded-lg border px-3 py-2 text-sm ${SEVERITY_CLASS[s.severity]}`}>
                <span className="mr-2 font-bold">[{SEVERITY_LABEL[s.severity]}]</span>
                {s.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-bold text-slate-900">PV・セッション・ユーザー(GA4・90日)</h2>
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
          <Ga4Chart rows={ga4Rows} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-slate-900">クリック・表示回数(GSC・90日)</h2>
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
          <ClicksChart rows={gscRows} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-slate-900">CTR・平均順位(GSC・90日)</h2>
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
          <CtrPositionChart rows={gscRows} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-slate-900">サイト設定</h2>
        <form action={boundUpdate} className="mt-2 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <label className="text-sm text-slate-600">
            ドメイン
            <input
              type="text"
              name="domain"
              defaultValue={site.domain ?? ""}
              placeholder="example.jp"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-slate-600">
            Search Console プロパティ
            <input
              type="text"
              name="gsc_property"
              defaultValue={site.gsc_property ?? ""}
              placeholder="sc-domain:example.jp または https://example.jp/"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
            {serviceAccountEmail && (
              <span className="mt-1 block text-xs text-slate-400">
                このプロパティのSearch Consoleに {serviceAccountEmail} を「制限付き」ユーザーとして追加してください。
              </span>
            )}
          </label>
          <label className="text-sm text-slate-600">
            GA4 プロパティID
            <input
              type="text"
              name="ga4_property_id"
              defaultValue={site.ga4_property_id ?? ""}
              placeholder="123456789"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
            {serviceAccountEmail && (
              <span className="mt-1 block text-xs text-slate-400">
                GA4管理画面(プロパティ設定 → プロパティのアクセス管理)で {serviceAccountEmail} を「閲覧者」として追加してください。
              </span>
            )}
          </label>
          <label className="text-sm text-slate-600">
            カテゴリ
            <input
              type="text"
              name="category"
              defaultValue={site.category ?? ""}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="is_active" defaultChecked={site.is_active} />
            集計対象にする
          </label>
          <button type="submit" className="self-start rounded bg-blue-600 px-4 py-2 font-bold text-white">
            保存
          </button>
        </form>
      </section>
    </div>
  );
}
