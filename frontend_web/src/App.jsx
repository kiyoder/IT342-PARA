import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import SavedRoutes from "./pages/SavedRoutes";
import { LocationProvider } from "./contexts/LocationContext";
import { RouteProvider } from "./contexts/RouteContext";
import ErrorBoundary from "./components/layout/ErrorBoundary";

function App() {
  return (
    <Router>
      <div className="App">
        <LocationProvider>
          <RouteProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <ErrorBoundary>
                    <Login />
                  </ErrorBoundary>
                }
              />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route
                path="/saved-routes"
                element={
                  <ErrorBoundary>
                    <SavedRoutes />
                  </ErrorBoundary>
                }
              />
            </Routes>
          </RouteProvider>
        </LocationProvider>
      </div>
    </Router>
  );
}

export default App;
