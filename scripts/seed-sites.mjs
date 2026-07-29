// One-off script: seeds tk_sites from the GitHub repo list + Vercel project list.
// Usage: node scripts/seed-sites.mjs <repos.json> <vercel-projects.json>
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const i = line.indexOf("=");
  if (i === -1) continue;
  process.env[line.slice(0, i)] = line.slice(i + 1).replace(/^"|"$/g, "");
}

const [reposPath, vercelPath] = process.argv.slice(2);
const repos = JSON.parse(readFileSync(reposPath, "utf8"));
const vercelProjects = JSON.parse(readFileSync(vercelPath, "utf8")).projects;

const vercelByName = new Map(vercelProjects.map((p) => [p.name, p]));

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const rows = repos.map((repo) => {
  const vercelProject = vercelByName.get(repo.name);
  const productionUrl = vercelProject?.latestProductionUrl ?? null;
  const domain = productionUrl ? productionUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;

  return {
    repo_name: repo.name,
    display_name: repo.name,
    domain,
    github_url: repo.url,
    vercel_url: productionUrl,
    gsc_property: null,
    category: null,
    is_active: true,
  };
});

const { error, count } = await supabase.from("tk_sites").upsert(rows, { onConflict: "repo_name", count: "exact" });
if (error) {
  console.error("seed failed:", error.message);
  process.exit(1);
}
console.log(`seeded ${rows.length} sites (upserted, count=${count})`);
