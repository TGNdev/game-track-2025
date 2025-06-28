import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "../pages/Home";
import RedditFeed from "../pages/RedditFeed";
import PageFade from "../components/shared/PageFade";
import Hof from "../pages/Hof";
import AwardsHistory from "../pages/AwardsHistory";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageFade>
              <Home />
            </PageFade>
          }
        />
        <Route
          path="/leaks-rumours"
          element={
            <PageFade>
              <RedditFeed />
            </PageFade>
          }
        />
        <Route
          path="/hall-of-fame"
          element={
            <PageFade>
              <Hof />
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
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
