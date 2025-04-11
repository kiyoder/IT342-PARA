import MapView from "../components/MapView";
import SearchBox from "../components/SearchBox";
import TopSearchBar from "../components/TopSearchBar";
import ProfileMenu from "../components/ProfileMenu";
import RouteSearch from "../components/RouteSearch";
import { LocationProvider } from "../components/LocationContext";
import { RouteProvider } from "../components/RouteContext";

const Home = () => {
  return (
    <div>
      <LocationProvider>
        <RouteProvider>
          <MapView />
          <TopSearchBar />
          <SearchBox />
          <ProfileMenu />
          <RouteSearch />
        </RouteProvider>
      </LocationProvider>
    </div>
  );
};

export default Home;
