import { JWT } from "google-auth-library";

const SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"];

function loadServiceAccount(): { client_email: string; private_key: string } | null {
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!base64) return null;
  const json = Buffer.from(base64, "base64").toString("utf8");
  const parsed = JSON.parse(json);
  return { client_email: parsed.client_email, private_key: parsed.private_key };
}

let cachedClient: JWT | null = null;

function getJwtClient(): JWT | null {
  if (cachedClient) return cachedClient;
  const account = loadServiceAccount();
  if (!account) return null;
  cachedClient = new JWT({
    email: account.client_email,
    key: account.private_key,
    scopes: SCOPES,
  });
  return cachedClient;
}

export function getServiceAccountEmail(): string | null {
  return loadServiceAccount()?.client_email ?? null;
}

export interface Ga4DailyRow {
  date: string; // YYYY-MM-DD
  sessions: number;
  activeUsers: number;
  pageViews: number;
  engagementRate: number;
}

/** Fetches per-day sessions/users/pageviews/engagement rate for a GA4 property over a date range. */
export async function fetchGa4AnalyticsByDay(
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<Ga4DailyRow[]> {
  const client = getJwtClient();
  if (!client) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 is not configured");

  const res = await client.request<{
    rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
  }>({
    url: `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
    method: "POST",
    data: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "activeUsers" },
        { name: "screenPageViews" },
        { name: "engagementRate" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 1000,
    },
  });

  return (res.data.rows ?? []).map((row) => {
    const raw = row.dimensionValues[0].value; // YYYYMMDD
    const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    const [sessions, activeUsers, pageViews, engagementRate] = row.metricValues.map((m) => Number(m.value));
    return { date, sessions, activeUsers, pageViews, engagementRate };
  });
}
