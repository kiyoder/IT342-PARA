"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

const RouteContext = createContext();

// Predefined dark-themed palette
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
  const [routeColors, setRouteColors] = useState({ default: "#1D5F8C" });
  const [matchingRoutes, setMatchingRoutes] = useState([]);
  const [showRouteResults, setShowRouteResults] = useState(false);

  // keep track of which palette index to hand out next
  const colorIndex = useRef(0);

  const getNextColor = useCallback(() => {
    const color = DEFAULT_COLORS[colorIndex.current % DEFAULT_COLORS.length];
    colorIndex.current += 1;
    return color;
  }, []);

  const resetRouteColors = useCallback(() => {
    setRouteColors({ default: "#1D5F8C" });
    colorIndex.current = 0;
  }, []);

  const setRouteNumber = useCallback(
    (num) => {
      const key = num?.trim().toUpperCase();
      _setRouteNumber(key);
      setRouteColors((colors) => {
        if (colors[key]) return colors;
        return { ...colors, [key]: getNextColor() };
      });
    },
    [getNextColor]
  );

  const setRelationId = useCallback((id) => {
    _setRelationId(id);
  }, []);

  const setRouteSearchResults = useCallback(
    (routes) => {
      // start fresh on every new result set
      resetRouteColors();

      // assign a unique color to each route in order
      setRouteColors((colors) => {
        const updated = { ...colors };
        routes.forEach(({ routeNumber }) => {
          const key = routeNumber?.trim().toUpperCase();
          if (key && !updated[key]) {
            updated[key] = getNextColor();
          }
        });
        return updated;
      });

      setMatchingRoutes(routes);
      setShowRouteResults(true);
    },
    [getNextColor, resetRouteColors]
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

        matchingRoutes,
        routeColors,

        getRouteColor,
        resetRouteColors,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => useContext(RouteContext);
