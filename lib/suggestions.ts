import type { Ga4Daily, GscDaily, Suggestion } from "@/lib/types";

type Draft = { severity: Suggestion["severity"]; category: string; message: string };

function sum(rows: GscDaily[], key: "clicks" | "impressions"): number {
  return rows.reduce((acc, r) => acc + r[key], 0);
}

function avg(rows: GscDaily[], key: "ctr" | "position"): number {
  if (rows.length === 0) return 0;
  return rows.reduce((acc, r) => acc + r[key], 0) / rows.length;
}

/**
 * Rule-based improvement suggestions from the last ~28 days of daily GSC metrics.
 * `dailyRows` must be sorted oldest-first and already filtered to one site.
 */
export function computeSuggestions(dailyRows: GscDaily[]): Draft[] {
  const drafts: Draft[] = [];

  if (dailyRows.length === 0) {
    drafts.push({
      severity: "warning",
      category: "no_data",
      message: "直近14日間、Search Consoleのデータが取得できていません。サービスアカウントへの権限付与を確認してください。",
    });
    return drafts;
  }

  const last14 = dailyRows.slice(-14);
  const last7 = dailyRows.slice(-7);
  const prior7 = dailyRows.slice(-14, -7);

  const clicksLast7 = sum(last7, "clicks");
  const clicksPrior7 = sum(prior7, "clicks");
  const impressionsLast14 = sum(last14, "impressions");
  const ctrLast14 = avg(last14, "ctr");
  const positionLast7 = avg(last7, "position");
  const positionPrior7 = avg(prior7, "position");

  if (impressionsLast14 >= 100 && ctrLast14 < 0.01) {
    drafts.push({
      severity: "warning",
      category: "low_ctr",
      message: `表示回数は${impressionsLast14}回ありますが、CTRが${(ctrLast14 * 100).toFixed(2)}%と低めです。タイトル・メタディスクリプションの見直しを検討してください。`,
    });
  }

  if (clicksPrior7 >= 10) {
    const change = (clicksLast7 - clicksPrior7) / clicksPrior7;
    if (change <= -0.3) {
      drafts.push({
        severity: "critical",
        category: "traffic_decline",
        message: `直近7日間のクリック数が前週比${(change * 100).toFixed(0)}%(${clicksPrior7}→${clicksLast7})に減少しています。順位低下や競合の増加が疑われます。`,
      });
    } else if (change >= 0.5) {
      drafts.push({
        severity: "info",
        category: "growth",
        message: `直近7日間のクリック数が前週比+${(change * 100).toFixed(0)}%(${clicksPrior7}→${clicksLast7})と増加しています。伸びている要因を他サイトにも展開できないか検討してください。`,
      });
    }
  }

  if (positionPrior7 > 0 && positionPrior7 <= 20 && positionLast7 - positionPrior7 >= 5) {
    drafts.push({
      severity: "warning",
      category: "position_drop",
      message: `平均掲載順位が${positionPrior7.toFixed(1)}位→${positionLast7.toFixed(1)}位に悪化しています。コンテンツの鮮度や被リンク状況を確認してください。`,
    });
  }

  return drafts;
}

function ga4Sum(rows: Ga4Daily[], key: "sessions" | "active_users" | "page_views"): number {
  return rows.reduce((acc, r) => acc + r[key], 0);
}

function ga4Avg(rows: Ga4Daily[], key: "engagement_rate"): number {
  if (rows.length === 0) return 0;
  return rows.reduce((acc, r) => acc + r[key], 0) / rows.length;
}

/**
 * Rule-based improvement suggestions from the last ~28 days of daily GA4 metrics.
 * `dailyRows` must be sorted oldest-first and already filtered to one site.
 */
export function computeGa4Suggestions(dailyRows: Ga4Daily[]): Draft[] {
  const drafts: Draft[] = [];

  if (dailyRows.length === 0) {
    drafts.push({
      severity: "warning",
      category: "no_ga4_data",
      message: "直近14日間、GA4のデータが取得できていません。サービスアカウントへの権限付与を確認してください。",
    });
    return drafts;
  }

  const last14 = dailyRows.slice(-14);
  const last7 = dailyRows.slice(-7);
  const prior7 = dailyRows.slice(-14, -7);

  const pvLast7 = ga4Sum(last7, "page_views");
  const pvPrior7 = ga4Sum(prior7, "page_views");
  const engagementLast14 = ga4Avg(last14, "engagement_rate");

  if (pvPrior7 >= 20) {
    const change = (pvLast7 - pvPrior7) / pvPrior7;
    if (change <= -0.3) {
      drafts.push({
        severity: "critical",
        category: "pv_decline",
        message: `直近7日間のPVが前週比${(change * 100).toFixed(0)}%(${pvPrior7}→${pvLast7})に減少しています。流入元の変化を確認してください。`,
      });
    } else if (change >= 0.5) {
      drafts.push({
        severity: "info",
        category: "pv_growth",
        message: `直近7日間のPVが前週比+${(change * 100).toFixed(0)}%(${pvPrior7}→${pvLast7})と増加しています。伸びている流入元を他サイトにも展開できないか検討してください。`,
      });
    }
  }

  if (ga4Sum(last14, "active_users") >= 20 && engagementLast14 < 0.3) {
    drafts.push({
      severity: "warning",
      category: "low_engagement",
      message: `エンゲージメント率が${(engagementLast14 * 100).toFixed(1)}%と低めです。ファーストビューの内容や導線を見直してください。`,
    });
  }

  return drafts;
}
