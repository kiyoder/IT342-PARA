import React from "react";
import MapView from "../components/MapView";
import SearchBox from "../components/SearchBox";
import TopSearchBar from "../components/TopSearchBar";
import { LocationProvider } from "../components/LocationContext";

const Home = () => {
  return (
    <div>
      <MapView />
      <LocationProvider>
        <TopSearchBar />
        <SearchBox />
      </LocationProvider>
    </div>
  );
};

export default Home;
