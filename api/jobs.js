// api/jobs.js
export default async function handler(req, res) {
  try {
    // Grab query params (like ?search=design or ?category=software-dev)
    const { search, category, company_name } = req.query;

    // Build base URL
    let url = "https://remotive.com/api/remote-jobs";

    // Add query params if provided
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category) params.append("category", category);
    if (company_name) params.append("company_name", company_name);

    if ([...params].length > 0) {
      url += `?${params.toString()}`;
    }

    // Fetch jobs
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Remotive API error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs", details: error.message });
  }
}
