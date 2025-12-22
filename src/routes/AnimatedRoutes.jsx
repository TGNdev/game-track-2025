import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "../pages/Home";
import PageFade from "../components/shared/PageFade";
import AwardsHistory from "../pages/AwardsHistory";
import ReleaseCalendar from "../pages/ReleaseCalendar";
import Welcome from "../pages/Welcome";

function FirstRunGate({ children }) {
  const hasSeen = localStorage.getItem("hasSeenWelcome") === "true";
  if (!hasSeen) return <Navigate to="/welcome" replace />;
  return children;
}

const AnimatedRoutes = () => {
  const location = useLocation();
  const routeKey = `${location.pathname}${location.search}${location.hash}`;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={routeKey}>
        <Route
          path="/welcome"
          element={
            <PageFade>
              <Welcome />
            </PageFade>
          }
        />
        <Route
          path="/"
          element={
            <PageFade>
              <FirstRunGate>
                <Home />
              </FirstRunGate>
            </PageFade>
          }
        />
        <Route
          path="/game-awards-history"
          element={
            <PageFade>
              <AwardsHistory />
            </PageFade>
          }
        />
        <Route
          path="/game-awards-history/:year"
          element={
            <PageFade>
              <AwardsHistory />
            </PageFade>
          }
        />
        <Route
          path="/game-awards-history/:year/:awardId"
          element={
            <PageFade>
              <AwardsHistory />
            </PageFade>
          }
        />
        <Route
          path="/release-calendar"
          element={
            <PageFade>
              <ReleaseCalendar />
            </PageFade>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
