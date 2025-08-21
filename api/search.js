// /api/search.js
export default async function handler(req, res) {
  const { query } = req.query; // query param e.g. /api/search?query=Amazon

  try {
    // Fetch jobs from your jobs endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs`);
    const data = await response.json();

    // If no query, just return all jobs
    if (!query) {
      return res.status(200).json({
        query: null,
        results: data.jobs,
        total: data.jobs.length,
      });
    }

    // Lowercase for matching
    const search = query.toLowerCase();

    // Filter across multiple fields
    const filtered = data.jobs.filter((job) => {
      return (
        job.company_name?.toLowerCase().includes(search) ||
        job.title?.toLowerCase().includes(search) ||
        job.description?.toLowerCase().includes(search) ||
        job.tags?.some((tag) => tag.toLowerCase().includes(search))
      );
    });

    return res.status(200).json({
      query,
      results: filtered,
      total: filtered.length,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch jobs", details: err.message });
  }
}
