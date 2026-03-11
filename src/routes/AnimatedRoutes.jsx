import { Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "../pages/Home";
import PageFade from "../components/shared/PageFade";
import AwardsHistory from "../pages/AwardsHistory";
import ReleaseCalendar from "../pages/ReleaseCalendar";
import Welcome from "../pages/Welcome";
import GameDetails from "../pages/GameDetails";
import Profile from "../pages/Profile";
import Admin from "../pages/Admin";
import IndustryWatch from "../pages/IndustryWatch";
import Developers from "../pages/Developers";
import IndustryDetails from "../pages/IndustryDetails";
import { adminRoutes } from "./adminRoutes";

const PageLayout = () => (
  <PageFade>
    <Outlet />
  </PageFade>
);

const FirstRunGate = () => {
  const hasSeen = localStorage.getItem("hasSeenWelcome") === "true";
  if (!hasSeen) return <Navigate to="/welcome" replace />;
  return <Outlet />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const routeKey = `${location.pathname}${location.search}${location.hash} `;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={routeKey}>
        <Route element={<PageLayout />}>
          <Route path="/welcome" element={<Welcome />} />
        </Route>

        <Route element={<FirstRunGate />}>
          <Route element={<PageLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/industry-watch" element={<IndustryWatch />} />
            <Route path="/release-calendar" element={<ReleaseCalendar />} />

            <Route path="/games/:game" element={<GameDetails />} />
            <Route path="/industry" element={<Developers />} />
            <Route path="/industry/:id" element={<IndustryDetails />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/developers/:id" element={<IndustryDetails />} />
            <Route path="/editors" element={<Developers />} />
            <Route path="/editors/:id" element={<IndustryDetails />} />

            <Route path="/game-awards-history">
              <Route index element={<AwardsHistory />} />
              <Route path=":year" element={<AwardsHistory />} />
              <Route path=":year/:awardId" element={<AwardsHistory />} />
            </Route>

            <Route path="/profiles/:username" element={<Profile />} />

            <Route path="/admin">
              <Route index element={<Admin />} />
              {adminRoutes.map(({ path, component: Component }) => (
                <Route
                  key={path}
                  path={path}
                  element={<Component />}
                />
              ))}
            </Route>
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
