// api/search.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const { q = "", ...rest } = req.query || {};
    // Remotive uses "search=" param; pass through any other filters too
    const params = new URLSearchParams({ search: q });
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined && v !== "") params.append(k, v);
    }

    const url = `https://remotive.com/api/remote-jobs?${params.toString()}`;
    const r = await fetch(url);
    const data = await r.json();

    res.status(r.ok ? 200 : 500).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || "Search failed" });
  }
}
