import React from "react";
import MapView from "../components/MapView";
import SearchBox from "../components/SearchBox";
import TopSearchBar from "../components/TopSearchBar";

const Home = () => {
  return (
    <div>
      <MapView />
      <SearchBox />
      <TopSearchBar />
    </div>
  );
};

export default Home;
