"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GscDaily } from "@/lib/types";

export function ClicksChart({ rows }: { rows: GscDaily[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={rows}>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={20} />
        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey="clicks" name="クリック" stroke="#2563eb" dot={false} />
        <Line type="monotone" dataKey="impressions" name="表示回数" stroke="#94a3b8" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CtrPositionChart({ rows }: { rows: GscDaily[] }) {
  const data = rows.map((r) => ({ ...r, ctrPct: r.ctr * 100 }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={20} />
        <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
        <YAxis yAxisId="right" orientation="right" reversed tick={{ fontSize: 10 }} />
        <Tooltip />
        <Line yAxisId="left" type="monotone" dataKey="ctrPct" name="CTR(%)" stroke="#16a34a" dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="position" name="平均順位" stroke="#d97706" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
