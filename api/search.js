// api/search.js
// Flexible search endpoint for your jobs proxy.
// - Works even with NO company_name
// - Supports keyword, company, location, category, job_type
// - Pagination with page & limit
// - raw=true returns full job objects; default returns a simplified list

export default async function handler(req, res) {
  // CORS (basic)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ---- Parse & sanitize query params ----
    const {
      query = "",                // keyword
      company_name = "",         // filter by company
      location = "",             // filter by country/region text
      category = "",             // e.g. "Software Development"
      job_type = "",             // e.g. "full_time"
      page = "1",                // 1-based
      limit = "25",              // items per page
      raw = "false",             // raw=true -> full objects
    } = req.query || {};

    const p = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(50, Math.max(1, parseInt(limit, 10) || 25)); // cap at 50

    // ---- Fetch from Remotive (keyword only; other filters done here) ----
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(
      query || ""
    )}`;

    const r = await fetch(url, { headers: { "User-Agent": "CCH-API/1.0" } });
    if (!r.ok) {
      return res.status(r.status).json({
        ok: false,
        error: `Upstream error ${r.status}`,
      });
    }
    const upstream = await r.json();
    const jobs = Array.isArray(upstream.jobs) ? upstream.jobs : [];

    // ---- Helpers for filtering ----
    const norm = (v) => String(v || "").toLowerCase();
    const includes = (hay, needle) => norm(hay).includes(norm(needle));

    // ---- Apply filters (case-insensitive) ----
    let filtered = jobs;

    if (company_name) {
      filtered = filtered.filter((j) => includes(j.company_name, company_name));
    }
    if (location) {
      filtered = filtered.filter((j) =>
        includes(j.candidate_required_location, location)
      );
    }
    if (category) {
      filtered = filtered.filter((j) => norm(j.category) === norm(category));
    }
    if (job_type) {
      filtered = filtered.filter((j) => norm(j.job_type) === norm(job_type));
    }

    // ---- Pagination ----
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / lim));
    const start = (p - 1) * lim;
    const pageSlice = filtered.slice(start, start + lim);

    // ---- Build response ----
    const meta = {
      ok: true,
      query: {
        query,
        company_name,
        location,
        category,
        job_type,
        page: p,
        limit: lim,
      },
      total,
      pages,
      count: pageSlice.length,
    };

    // raw=true -> return full upstream job objects for this page
    if (String(raw).toLowerCase() === "true") {
      return res.status(200).json({
        ...meta,
        results: pageSlice,
      });
    }

    // default -> simplified list for easier frontend use
    const simplified = pageSlice.map((j) => ({
      id: j.id,
      url: j.url,
      title: j.title,
      company: j.company_name,
      logo: j.company_logo,
      category: j.category,
      tags: j.tags,
      job_type: j.job_type,
      date: j.publication_date,
      location: j.candidate_required_location,
      salary: j.salary || null,
      // Keep original HTML so you can render safely in UI if needed
      description_html: j.description,
    }));

    return res.status(200).json({
      ...meta,
      results: simplified,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e.message || "Search failed",
    });
  }
}
