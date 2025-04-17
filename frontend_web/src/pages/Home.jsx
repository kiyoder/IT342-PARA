"use client";

import { useState } from "react";
import MapView from "../components/map/MapView";
import SearchBox from "../components/location/SearchBox";
import TopSearchBar from "../components/location/TopSearchBar";
import ProfileMenu from "../components/layout/ProfileMenu";
import RouteSearch from "../components/route/RouteSearch";

const Home = () => {
  const [isSearching, setIsSearching] = useState(false);

  return (
    <div>
      <MapView />

      {/* Only show these components when not searching */}
      {!isSearching && (
        <>
          <TopSearchBar />
          <ProfileMenu />
          <RouteSearch />
        </>
      )}

      {/* SearchBox handles its own visibility during search */}
      <SearchBox setIsSearching={setIsSearching} />
    </div>
  );
};

export default Home;
