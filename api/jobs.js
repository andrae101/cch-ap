// /api/jobs.js  — Edge Function (fast + no extra packages)
export const config = { runtime: "edge" };

const CORS = {
  "content-type": "application/json",
  "access-control-allow-origin": "*",
};

export default async function handler(req) {
  try {
    // Optional query params: ?search=developer&limit=50
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const limit = searchParams.get("limit") || "50";

    const apiUrl =
      "https://remotive.com/api/remote-jobs" +
      `?search=${encodeURIComponent(search)}&limit=${encodeURIComponent(limit)}`;

    const r = await fetch(apiUrl, { headers: { accept: "application/json" } });

    if (!r.ok) {
      return new Response(
        JSON.stringify({ error: "Upstream error", status: r.status }),
        { status: 502, headers: CORS }
      );
    }

    const data = await r.json();
    return new Response(JSON.stringify(data), { status: 200, headers: CORS });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message || "Failed to fetch jobs" }),
      { status: 500, headers: CORS }
    );
  }
}
