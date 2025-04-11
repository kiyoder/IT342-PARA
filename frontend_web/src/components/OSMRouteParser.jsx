/**
 * Parse OSM relation data for a given relation ID using Overpass API,
 * extract the ways in order, and stitch together segments without forcing
 * non-adjacent segments to connect.
 *
 * @param {string} relationId - The OSM relation ID (e.g., "3179695" for Jeepney 13C)
 * @returns {Promise<Array>} Promise resolving to either:
 *    - An array of [lon, lat] pairs (if there is one continuous segment), or
 *    - An array of segments (each segment is an array of [lon, lat] pairs) for a MultiLineString.
 */
export const parseOsmRouteData = async (relationId) => {
  try {
    const query = `
[out:json][timeout:25];
relation(${relationId});
>>;
out geom;
    `.trim();

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    });
    if (!response.ok) {
      throw new Error("Failed to fetch Overpass data");
    }
    const data = await response.json();

    // Expose the raw data from Overpass to the console.
    console.log("Overpass API response data:", data);

    const relation = data.elements.find(
      (el) => el.type === "relation" && el.id.toString() === relationId
    );
    if (!relation) {
      throw new Error("Relation not found in Overpass response");
    }

    // Get each way member's geometry as a separate segment.
    const wayMembers = relation.members.filter((m) => m.type === "way");
    let segments = [];

    for (const member of wayMembers) {
      const way = data.elements.find(
        (el) => el.type === "way" && el.id === member.ref
      );
      if (way && way.geometry) {
        let coords = way.geometry.map((pt) => [pt.lon, pt.lat]);
        if (member.role === "backward") {
          coords.reverse();
        }
        segments.push(coords);
      }
    }

    // Optional: Merge segments if the end of one equals the beginning of the next.
    let mergedSegments = [];
    for (const seg of segments) {
      if (mergedSegments.length === 0) {
        mergedSegments.push(seg);
      } else {
        let lastSeg = mergedSegments[mergedSegments.length - 1];
        const lastCoord = lastSeg[lastSeg.length - 1];
        const firstCoord = seg[0];
        if (lastCoord[0] === firstCoord[0] && lastCoord[1] === firstCoord[1]) {
          // They are contiguous—merge them (avoiding duplicate coordinate).
          mergedSegments[mergedSegments.length - 1] = lastSeg.concat(
            seg.slice(1)
          );
        } else {
          // Not contiguous, keep as separate segment.
          mergedSegments.push(seg);
        }
      }
    }

    // Log the processed segments for debugging purposes.
    console.log("Processed segments:", mergedSegments);

    // If there's only one continuous segment, return it as a simple array.
    // If there are multiple segments, return them as a nested array (MultiLineString).
    if (mergedSegments.length === 1) {
      return mergedSegments[0];
    }
    return mergedSegments;
  } catch (error) {
    console.error("Error parsing Overpass data:", error);
    return [];
  }
};

/**
 * (Optional) Expose fetchWayData if needed.
 */
export const fetchWayData = async () => {
  return [];
};

export default { parseOsmRouteData, fetchWayData };
