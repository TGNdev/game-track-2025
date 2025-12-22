import React from "react";
import { Link } from "react-router-dom";
import BackTopButton from "./BackTopButton";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer role="contentinfo" className="mt-auto w-full">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center md:justify-between gap-4 border-t">
        <div className="flex items-center space-x-3">
          <img src="logo.png" alt="Game Track Logo" className="size-8" />
          <span className="text-sm hidden md:inline">© {year} Game Track. All rights reserved.</span>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-3 text-sm">
          <Link to="/" className="font-semibold text-white hover:text-primary transition">Home</Link>
          <Link to="/release-calendar" className="font-semibold text-white hover:text-primary transition">Calendars</Link>
          <Link to="/awards-history" className="font-semibold text-white hover:text-primary transition">Awards History</Link>
        </nav>
      </div>

      <div>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between text-xs">
          <span className="italic">Built with care and video games passion</span>
          <span className="md:hidden">© {year} Game Track</span>
        </div>
      </div>



      <BackTopButton />
    </footer>
  );
};

export default Footer;