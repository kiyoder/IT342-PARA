import React from "react";
import MapView from "../components/MapView";
import SearchBox from "../components/SearchBox";
import TopSearchBar from "../components/TopSearchBar";

const Home = () => {
  return (
    <div>
      <TopSearchBar />
      <MapView />
      <SearchBox />
    </div>
  );
};

export default Home;
