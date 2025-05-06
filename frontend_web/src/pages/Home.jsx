"use client";

import { useState } from "react";
import MapView from "../components/map/MapView";
import SearchBox from "../components/location/SearchBox";
import TopSearchBar from "../components/location/TopSearchBar";
import ProfileMenu from "../components/layout/ProfileMenu";
import RouteSearch from "../components/route/RouteSearch";
import RouteResults from "../components/route/RouteResults";
import { useRoute } from "../contexts/RouteContext";

const Home = () => {
  const [isSearching, setIsSearching] = useState(false);
  const { showRouteResults } = useRoute();

  return (
    <div>
      <MapView />

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
