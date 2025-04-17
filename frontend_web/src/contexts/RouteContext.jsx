"use client";

import { createContext, useContext, useState } from "react";

// Create a context for route information
const RouteContext = createContext();

export const RouteProvider = ({ children }) => {
  const [showJeepneyRoute, setShowJeepneyRoute] = useState(false);
  const [routeNumber, setRouteNumber] = useState("");
  const [relationId, setRelationId] = useState("");

  const value = {
    showJeepneyRoute,
    setShowJeepneyRoute,
    routeNumber,
    setRouteNumber,
    relationId,
    setRelationId,
  };

  return (
    <RouteContext.Provider value={value}>{children}</RouteContext.Provider>
  );
};

export const useRoute = () => {
  return useContext(RouteContext);
};
