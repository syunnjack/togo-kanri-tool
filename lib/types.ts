export interface Site {
  id: string;
  repo_name: string;
  display_name: string;
  domain: string | null;
  github_url: string | null;
  vercel_url: string | null;
  gsc_property: string | null;
  ga4_property_id: string | null;
  category: string | null;
  is_active: boolean;
  gsc_connected: boolean;
  ga4_connected: boolean;
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

export interface Ga4Daily {
  id: number;
  site_id: string;
  date: string;
  sessions: number;
  active_users: number;
  page_views: number;
  engagement_rate: number;
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
