"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

const RouteContext = createContext();

// Define colors outside the component to avoid dependency issues
// Removed orange, using only dark colors
const DEFAULT_COLORS = [
  "#1D8C2E", // Dark Green
  "#8C1D1D", // Maroon
  "#1D5F8C", // Dark Blue
  "#8C6D1D", // Dark Brown
  "#5D1D8C", // Dark Purple
  "#E03000", // Dark Red
  "#996600", // Dark Gold
  "#990066", // Dark Pink
  "#4B0082", // Indigo
];

export const RouteProvider = ({ children }) => {
  const [showJeepneyRoute, setShowJeepneyRoute] = useState(false);
  const [routeNumber, _setRouteNumber] = useState("");
  const [relationId, _setRelationId] = useState("");

  const [routeColors, setRouteColors] = useState({
    default: "#1D5F8C", // Changed default from orange to dark blue
  });

  const [matchingRoutes, setMatchingRoutes] = useState([]);
  const [showRouteResults, setShowRouteResults] = useState(false);

  // Use useMemo for functions that don't need to be recreated on every render
  const generateRandomColor = useMemo(() => {
    return () => {
      const idx = Math.floor(Math.random() * DEFAULT_COLORS.length);
      return DEFAULT_COLORS[idx];
    };
  }, []);

  const setRouteNumber = useCallback(
    (num) => {
      const key = num?.trim().toUpperCase();
      _setRouteNumber(key);
      setRouteColors((colors) => {
        if (colors[key]) return colors;
        return { ...colors, [key]: generateRandomColor() };
      });
    },
    [generateRandomColor]
  );

  const setRelationId = useCallback((id) => {
    _setRelationId(id);
  }, []);

  const setRouteSearchResults = useCallback(
    (routes) => {
      setRouteColors((colors) => {
        const updated = { ...colors };
        routes.forEach(({ routeNumber }) => {
          const key = routeNumber?.trim().toUpperCase(); // normalize!
          if (key && !updated[key]) {
            updated[key] = generateRandomColor();
          }
        });

        return updated;
      });

      setMatchingRoutes(routes);
      setShowRouteResults(true);
    },
    [generateRandomColor]
  );

  const hideRouteResults = useCallback(() => {
    setShowRouteResults(false);
  }, []);

  const getRouteColor = useCallback(
    (routeNum) => {
      const key = routeNum?.trim().toUpperCase();
      return routeColors[key] || routeColors["default"];
    },
    [routeColors]
  );

  return (
    <RouteContext.Provider
      value={{
        showRouteResults,
        setRouteSearchResults,
        hideRouteResults,

        routeNumber,
        setRouteNumber,
        relationId,
        setRelationId,

        showJeepneyRoute,
        setShowJeepneyRoute,

        routeColors,
        matchingRoutes,

        getRouteColor,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
};

const useRoute = () => useContext(RouteContext);
export { useRoute };
