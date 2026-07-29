export interface Site {
  id: string;
  repo_name: string;
  display_name: string;
  domain: string | null;
  github_url: string | null;
  vercel_url: string | null;
  gsc_property: string | null;
  category: string | null;
  is_active: boolean;
  gsc_connected: boolean;
  created_at: string;
}

export interface GscDaily {
  id: number;
  site_id: string;
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export type SuggestionSeverity = "info" | "warning" | "critical";

export interface Suggestion {
  id: number;
  site_id: string;
  created_at: string;
  severity: SuggestionSeverity;
  category: string;
  message: string;
  is_resolved: boolean;
}
