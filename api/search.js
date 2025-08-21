export default async function handler(req, res) {
  const { company_name } = req.query;

  if (!company_name) {
    return res.status(400).json({ error: "Missing required parameter: company_name" });
  }

  try {
    const response = await fetch("https://remotive.com/api/remote-jobs");
    const data = await response.json();

    // Filter jobs by company name (case-insensitive)
    const filteredJobs = data.jobs.filter(job =>
      job.company_name.toLowerCase().includes(company_name.toLowerCase())
    );

    res.status(200).json({
      query: company_name,
      results: filteredJobs,
      total: filteredJobs.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs", details: error.message });
  }
}
