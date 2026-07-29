import type { GscDaily } from "@/lib/types";

export interface SiteSummary {
  clicksLast7: number;
  clicksPrior7: number;
  clicksChangePct: number | null;
  impressionsLast7: number;
  ctrLast7: number;
  positionLast7: number;
  hasData: boolean;
}

export function summarizeRows(rows: GscDaily[]): SiteSummary {
  const last7 = rows.slice(-7);
  const prior7 = rows.slice(-14, -7);

  const clicksLast7 = last7.reduce((a, r) => a + r.clicks, 0);
  const clicksPrior7 = prior7.reduce((a, r) => a + r.clicks, 0);
  const impressionsLast7 = last7.reduce((a, r) => a + r.impressions, 0);
  const ctrLast7 = last7.length ? last7.reduce((a, r) => a + r.ctr, 0) / last7.length : 0;
  const positionLast7 = last7.length ? last7.reduce((a, r) => a + r.position, 0) / last7.length : 0;

  return {
    clicksLast7,
    clicksPrior7,
    clicksChangePct: clicksPrior7 > 0 ? (clicksLast7 - clicksPrior7) / clicksPrior7 : null,
    impressionsLast7,
    ctrLast7,
    positionLast7,
    hasData: rows.length > 0,
  };
}

export function groupBySiteId<T extends { site_id: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(row.site_id) ?? [];
    list.push(row);
    map.set(row.site_id, list);
  }
  return map;
}
