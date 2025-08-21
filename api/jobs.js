// /api/jobs.js — Vercel Serverless Function (Node)
// Fetches live jobs from Remotive (public API) and returns JSON
// Works on https://<your-project>.vercel.app/api/jobs

export default async function handler(req, res) {
  // --- CORS (so your website can call this endpoint from any domain)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // --- Basic cache (edge/CDN) to be nice to Remotive + faster for users
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=300"); // 15 min

  // --- Read query params: ?search=developer&limit=10&company=Acme&category=Software&location=Jamaica
  const {
    search = "",
    limit = "20",
    company = "",
    category = "",
    location = "",
  } = req.query || {};

  // --- Build upstream URL (Remotive moved to .com)
  const url = new URL("https://remotive.com/api/remote-jobs");
  if (search)   url.searchParams.set("search", String(search));
  if (company)  url.searchParams.set("company_name", String(company));
  if (category) url.searchParams.set("category", String(category));
  if (location) url.searchParams.set("candidate_required_location", String(location));
  if (limit)    url.searchParams.set("limit", String(limit));

  try {
    const r = await fetch(url.toString(), {
      headers: {
        // optional but polite
        "User-Agent": "CarribCareerHub/1.0 (contact: admin@your-domain)"
      }
    });
    if (!r.ok) {
      return res.status(502).json({ error: "Upstream error from Remotive", status: r.status });
    }
    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch jobs", details: String(err?.message || err) });
  }
}
