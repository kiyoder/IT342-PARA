// Using Nominatim API from OpenStreetMap for location search
// Focused on Cebu, Philippines

export const fetchPlaces = async (query) => {
  if (!query.trim()) return [];

  try {
    // Nominatim API endpoint
    // Limiting to Cebu, Philippines with the viewbox and bounded parameters
    const viewbox = "123.5,10.0,124.5,11.0"; // Approximate bounding box for Cebu
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&addressdetails=1&viewbox=${viewbox}&bounded=1&countrycodes=ph&limit=10`;

    const response = await fetch(url, {
      headers: {
        // Adding a User-Agent header as required by Nominatim Usage Policy
        "User-Agent": "CebuLocationSearchApp",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch locations");
    }

    const data = await response.json();

    // Transform the Nominatim response to match our app's expected format
    return data.map((place) => ({
      name: place.display_name,
      type: place.type,
      category: place.category,
      latitude: place.lat,
      longitude: place.lon,
      // Extract more detailed information from address details
      details: {
        housenumber: place.address?.house_number || "",
        road:
          place.address?.road ||
          place.address?.pedestrian ||
          place.address?.footway ||
          "",
        suburb:
          place.address?.suburb ||
          place.address?.neighbourhood ||
          place.address?.quarter ||
          "",
        city:
          place.address?.city ||
          place.address?.town ||
          place.address?.village ||
          "",
        county: place.address?.county || "",
        state: place.address?.state || "",
        postcode: place.address?.postcode || "",
        amenity: place.address?.amenity || "",
        building: place.address?.building || "",
      },
    }));
  } catch (error) {
    console.error("Nominatim API error:", error);
    return [];
  }
};
