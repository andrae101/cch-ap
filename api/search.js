// api/search.js
export default async function handler(req, res) {
  // Allow simple CORS (handy if you call this from your site)
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Read query params (all optional)
  const {
    query = "",                 // general text search
    company_name = "",          // filter by company (case-insensitive contains)
    location = "",              // filter by location text (matches candidate_required_location)
    category = "",              // exact match with Remotive "category"
    job_type = "",              // exact match with Remotive "job_type" (e.g., "full_time", "contract")
    page = "1",                 // 1-based page
    limit = "25"                // page size
  } = req.query || {};

  // Parse pagination safely
  const PAGE = Math.max(1, parseInt(page, 10) || 1);
  const LIMIT = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

  try {
    // Build Remotive URL
    // If query is present, include it; otherwise call the base endpoint (returns latest jobs)
    const base = "https://remotive.com/api/remote-jobs";
    const url = query ? `${base}?search=${encodeURIComponent(query)}` : base;

    const r = await fetch(url);
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return res.status(502).json({ error: "Upstream API error", status: r.status, body: text });
    }
    const data = await r.json();

    // Normalize & filter safely
    const q = (query || "").toLowerCase();
    const cmp = (company_name || "").toLowerCase();
    const loc = (location || "").toLowerCase();
    const cat = (category || "").toLowerCase();
    const jt  = (job_type || "").toLowerCase();

    let jobs = Array.isArray(data?.jobs) ? data.jobs : [];

    jobs = jobs.filter((job) => {
      // company filter
      if (cmp && !(job.company_name || "").toLowerCase().includes(cmp)) return false;

      // location filter
      if (loc && !(job.candidate_required_location || "").toLowerCase().includes(loc)) return false;

      // category filter (exact, case-insensitive)
      if (cat && (job.category || "").toLowerCase() !== cat) return false;

      // job_type filter (exact, case-insensitive)
      if (jt && (job.job_type || "").toLowerCase() !== jt) return false;

      // If a text query is provided, also match against title/description/company
      if (q) {
        const hay = [
          job.title,
          job.description,
          job.company_name,
          job.tags?.join(" "),
          job.category
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });

    // Pagination
    const total = jobs.length;
    const start = (PAGE - 1) * LIMIT;
    const end   = start + LIMIT;
    const pageItems = jobs.slice(start, end);

    return res.status(200).json({
      ok: true,
      query: { query, company_name, location, category, job_type, page: PAGE, limit: LIMIT },
      total,
      pages: Math.max(1, Math.ceil(total / LIMIT)),
      count: pageItems.length,
      results: pageItems
    });
  } catch (e) {
    return res.status(500).json({ error: "Failed to fetch jobs", details: e.message });
  }
}
