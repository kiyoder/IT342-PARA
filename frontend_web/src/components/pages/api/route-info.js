import { db } from "../path/to/your/db"; // Update with your actual DB connection

/**
 * API handler to get relation ID for a given route number
 * @route GET /api/route-info?routeNumber=12D
 */
export default async function handler(req, res) {
  const { routeNumber } = req.query;

  if (!routeNumber) {
    return res.status(400).json({ error: "Route number is required" });
  }

  try {
    // Query the database to find the relation ID for the given route number
    const query = `SELECT relation_id FROM db_para.jeepney_routes WHERE route_number = ?`;
    const [results] = await db.execute(query, [
      routeNumber.trim().toUpperCase(),
    ]);

    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: `Route '${routeNumber}' not found` });
    }

    // Return the relation ID
    return res.status(200).json({
      routeNumber: routeNumber.trim().toUpperCase(),
      relationId: results[0].relation_id,
    });
  } catch (error) {
    console.error("Error fetching route info:", error);
    // Make sure we always return valid JSON
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}
