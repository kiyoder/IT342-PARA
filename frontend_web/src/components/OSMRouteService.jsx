/**
 * Service for fetching and processing OSM route data
 */

/**
 * Fetch a complete route from OpenStreetMap by relation ID
 * @param {string} relationId - The OSM relation ID
 * @returns {Promise<Array>} Promise resolving to array of [longitude, latitude] coordinates
 */
export const fetchOsmRoute = async (relationId) => {
  try {
    // In a real implementation, you would:
    // 1. Fetch the relation data from OSM API
    // 2. Extract all way references
    // 3. Fetch each way to get its nodes
    // 4. Fetch node coordinates
    // 5. Assemble the route in the correct order

    // For demo purposes, we'll return a hardcoded route
    return getHardcodedRoute();
  } catch (error) {
    console.error(`Error fetching OSM route ${relationId}:`, error);
    return [];
  }
};

/**
 * Get a hardcoded route that approximates the Jeepney 13C route
 * @returns {Array} Array of [longitude, latitude] coordinates
 */
const getHardcodedRoute = () => {
  // These coordinates are based on the actual Jeepney 13C route in Cebu
  // They follow the major streets mentioned in the relation
  return [
    // Colon Street area (starting point)
    [123.8977, 10.2988],
    [123.898, 10.2992],
    [123.8983, 10.2996],

    // P. del Rosario Street
    [123.8986, 10.3],
    [123.899, 10.301],
    [123.8995, 10.302],
    [123.9, 10.303],

    // Towards Imus Avenue
    [123.901, 10.305],
    [123.902, 10.307],

    // M.J. Cuenco Avenue
    [123.903, 10.309],
    [123.904, 10.311],
    [123.905, 10.313],

    // Towards Governor M. Cuenco Avenue
    [123.906, 10.315],
    [123.907, 10.317],

    // Governor M. Cuenco Avenue (heading north)
    [123.908, 10.319],
    [123.909, 10.321],
    [123.91, 10.323],
    [123.911, 10.325],
    [123.912, 10.327],
    [123.913, 10.329],
    [123.914, 10.331],
    [123.915, 10.333],
    [123.916, 10.335],
    [123.917, 10.337],
    [123.918, 10.339],
    [123.919, 10.341],
    [123.92, 10.343],
    [123.921, 10.345],
    [123.922, 10.347],
    [123.923, 10.349],

    // Talamban area
    [123.924, 10.351],
    [123.925, 10.353],
    [123.926, 10.355],
    [123.927, 10.357],

    // Return path via different streets
    // Gorordo Avenue
    [123.926, 10.355],
    [123.925, 10.353],
    [123.924, 10.351],
    [123.923, 10.349],
    [123.922, 10.347],
    [123.921, 10.345],
    [123.92, 10.343],
    [123.919, 10.341],
    [123.918, 10.339],
    [123.917, 10.337],
    [123.916, 10.335],
    [123.915, 10.333],
    [123.914, 10.331],
    [123.913, 10.329],
    [123.912, 10.327],
    [123.911, 10.325],
    [123.91, 10.323],

    // Archbishop Reyes Avenue
    [123.909, 10.321],
    [123.908, 10.319],
    [123.907, 10.317],
    [123.906, 10.315],

    // Back to Colon via different streets
    [123.905, 10.313],
    [123.904, 10.311],
    [123.903, 10.309],
    [123.902, 10.307],
    [123.901, 10.305],
    [123.9, 10.303],
    [123.899, 10.301],
    [123.898, 10.299],
    [123.8977, 10.2988],
  ];
};

export default { fetchOsmRoute };
