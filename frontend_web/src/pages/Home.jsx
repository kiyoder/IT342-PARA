"use client";

import { useState } from "react";
import MapView from "../components/map/MapView";
import SearchBox from "../components/location/SearchBox";
import TopSearchBar from "../components/location/TopSearchBar";
import ProfileMenu from "../components/layout/ProfileMenu";
import RouteSearch from "../components/route/RouteSearch";
import RouteResults from "../components/route/RouteResults";
import { useRoute } from "../contexts/RouteContext";
import UserLocationMarker from "../components/map/UserLocationMarker";
import { useRef } from "react";

const Home = () => {
  const [isSearching, setIsSearching] = useState(false);
  const { showRouteResults } = useRoute();
  const mapRef = useRef(null);

  return (
    <div>
      {/* Pass mapRef to MapView so it can be shared with UserLocationMarker */}
      <MapView mapRefProp={mapRef} />

      {/* Move UserLocationMarker here, outside of MapView */}
      <UserLocationMarker map={mapRef} />

      {/* ProfileMenu is always visible except during search */}
      {!isSearching && <ProfileMenu />}

      {/* TopSearchBar and SearchBox are hidden during search AND when showing route results */}
      {!isSearching && !showRouteResults && (
        <>
          <TopSearchBar />
          <RouteSearch />
        </>
      )}

      {/* RouteResults handles its own visibility */}
      <RouteResults />

      {/* SearchBox handles its own visibility during search, but hide when showing route results */}
      {!showRouteResults && <SearchBox setIsSearching={setIsSearching} />}
    </div>
  );
};

export default Home;
