import MapView from "../components/MapView";
import SearchBox from "../components/SearchBox";
import TopSearchBar from "../components/TopSearchBar";
import ProfileMenu from "../components/ProfileMenu";
import { LocationProvider } from "../components/LocationContext";

const Home = () => {
  return (
    <div>
      <LocationProvider>
        <MapView />
        <TopSearchBar />
        <SearchBox />
        <ProfileMenu />
      </LocationProvider>
    </div>
  );
};

export default Home;
