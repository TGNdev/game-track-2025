import React from "react";
import { Link } from "react-router-dom";
import { FaTwitter, FaDiscord, FaGithub, FaGamepad, FaShieldAlt } from "react-icons/fa";
import { useGameUI } from "../../contexts/GameUIContext";
import { useAuth } from "../../contexts/AuthContext";
import BackTopButton from "./BackTopButton";

const Footer = () => {
  const year = new Date().getFullYear();
  const { isLogged } = useGameUI();
  const { userData } = useAuth();

  const footerSections = [
    {
      title: "Exploration",
      links: [
        { label: "Home Feed", to: "/" },
        { label: "Welcome Page", to: "/welcome" },
        { label: "Release Calendar", to: "/release-calendar" },
        { label: "Awards History", to: "/game-awards-history" },
      ],
    },
    {
      title: "Industry Watch",
      links: [
        { label: "Market Overview", to: "/industry-watch" },
        { label: "Developers & Editors", to: "/industry" },
      ],
    },
    {
      title: isLogged ? "Your Account" : "Community",
      links: [
        { label: "My Profile", to: `/profiles/${userData?.username}` },
        userData?.isAdmin ? { label: "Admin Panel", to: "/admin" } : null,
      ].filter(Boolean),
    },
  ];

  return (
    <footer role="contentinfo" className="w-full mt-20 border-t border-white/10 bg-black/40 backdrop-blur-md relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="flex flex-col space-y-6">
            <Link to="/" className="flex items-center space-x-3 group w-fit">
              <div className="relative">
                <img src="logo.png" alt="Game Track Logo" className="relative size-10 object-contain" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent tracking-tighter">
                Game Track
              </span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              The ultimate destination for gaming enthusiasts. Tracking releases, celebrating achievements, and monitoring the industry pulse since 2025.
            </p>
          </div>

          {/* Links Columns */}
          {footerSections.map((section) => (
            <div key={section.title} className="flex flex-col space-y-6">
              <h3 className="text-white font-bold uppercase tracking-[0.2em] text-[10px] opacity-80">{section.title}</h3>
              <ul className="flex flex-col space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/50 hover:text-white transition-all text-sm flex items-center group w-fit"
                      >
                        <span className="w-0 group-hover:w-3 h-[1px] bg-gradient-primary mr-0 group-hover:mr-2 transition-all duration-300 opacity-0 group-hover:opacity-100" />
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-white/50 hover:text-white transition-all text-sm flex items-center group w-fit"
                      >
                        <span className="w-0 group-hover:w-3 h-[1px] bg-gradient-primary mr-0 group-hover:mr-2 transition-all duration-300 opacity-0 group-hover:opacity-100" />
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10 text-[11px] text-white/30 font-medium">
            <span className="tracking-widest">© {year} GAME TRACK PROJ.</span>
            {isLogged && userData?.isAdmin && (
              <div className="flex items-center gap-1.5 text-primary/60">
                <FaShieldAlt className="size-3" />
                <span>SECURED ADMIN ACCESS</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 group cursor-default">
            <span className="text-[11px] text-white/30 font-medium group-hover:text-white transition-colors duration-500">EXPERIENCE THE INDUSTRY</span>
            <div className="relative">
              <FaGamepad className="text-white/30 group-hover:text-primary transition-colors duration-500 size-4" />
              <div className="absolute inset-0 bg-primary/20 blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
        </div>
      </div>

      <BackTopButton />
    </footer>
  );
};

export default Footer;