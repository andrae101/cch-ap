// api/jobs.js
export default async function handler(req, res) {
  // Allow use from your site
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    // Base Remotive API
    const base = "https://remotive.com/api/remote-jobs";

    // Forward any query string you receive (?search=, ?category=, etc.)
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query || {})) {
      if (v !== undefined && v !== "") params.append(k, v);
    }

    const url = params.toString() ? `${base}?${params.toString()}` : base;
    const r = await fetch(url);
    const data = await r.json();

    res.status(r.ok ? 200 : 500).json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch jobs", detail: e.message });
  }
}
