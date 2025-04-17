import MapView from "../components/map/MapView";
import SearchBox from "../components/location/SearchBox";
import TopSearchBar from "../components/location/TopSearchBar";
import ProfileMenu from "../components/layout/ProfileMenu";
import RouteSearch from "../components/route/RouteSearch";

const Home = () => {
  return (
    <div>
      <MapView />
      <TopSearchBar />
      <SearchBox />
      <ProfileMenu />
      <RouteSearch />
    </div>
  );
};

export default Home;
