import { JWT } from "google-auth-library";

const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

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

export interface GscDailyRow {
  date: string; // YYYY-MM-DD
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/** Lists GSC properties the service account can currently access. */
export async function listAccessibleSites(): Promise<string[]> {
  const client = getJwtClient();
  if (!client) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 is not configured");
  const res = await client.request<{ siteEntry?: { siteUrl: string }[] }>({
    url: "https://www.googleapis.com/webmasters/v3/sites",
  });
  return (res.data.siteEntry ?? []).map((s) => s.siteUrl);
}

/** Fetches per-day clicks/impressions/ctr/position for a GSC property over a date range. */
export async function fetchSearchAnalyticsByDay(
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<GscDailyRow[]> {
  const client = getJwtClient();
  if (!client) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 is not configured");

  const res = await client.request<{
    rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
  }>({
    url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    method: "POST",
    data: {
      startDate,
      endDate,
      dimensions: ["date"],
      rowLimit: 1000,
    },
  });

  return (res.data.rows ?? []).map((row) => ({
    date: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));
}
