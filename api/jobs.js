export default async function handler(req, res) {
  try {
    const r = await fetch("https://remotive.com/api/remote-jobs");
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
}
