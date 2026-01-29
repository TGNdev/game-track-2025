import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowDown, FaArrowRight, FaArrowUp, FaHistory, FaCalendarAlt, FaSearch, FaGamepad } from "react-icons/fa";

export default function Welcome() {
  const navigate = useNavigate();
  const sections = useRef([]);
  const containerRef = useRef(null);
  const [active, setActive] = useState(0);

  const handleContinue = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const opts = { root: containerRef.current, threshold: 0.5 };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const idx = Number(entry.target.getAttribute("data-index"));
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          setActive(idx);
        } else {
          entry.target.classList.remove("in-view");
        }
      });
    }, opts);

    sections.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (i) => {
    const el = sections.current[i];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative h-screen w-full bg-background overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] size-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] size-[40%] bg-tertiary/20 blur-[120px] rounded-full pointer-events-none" />

      <div
        ref={containerRef}
        className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory scroll-smooth"
      >
        {/* HERO SECTION */}
        <section
          data-index={0}
          ref={(el) => (sections.current[0] = el)}
          className="snap-section min-h-screen flex items-center justify-center px-6 relative snap-start"
        >
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6 md:gap-8 py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative"
            >
              <img src="/logo.png" alt="Logo" className="w-28 md:w-56 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
              <div className="absolute -inset-4 bg-white/10 blur-3xl -z-10 rounded-full animate-pulse" />
            </motion.div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-8xl font-black tracking-tighter leading-none bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent opacity-0 delay-100 feature-text">
                GAME TRACK
              </h1>
              <p className="text-base md:text-2xl text-white/60 max-w-2xl mx-auto font-medium opacity-0 delay-200 feature-text">
                Your ultimate companion for video game releases, awards history, and real-time industry insights.
              </p>
            </div>

            <button
              onClick={() => scrollTo(1)}
              className="group flex items-center gap-3 bg-white text-black px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:scale-105 transition-all shadow-2xl opacity-0 delay-300 feature-text"
            >
              See New Features
              <FaArrowDown className="animate-bounce group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* CORE FEATURES SECTION */}
        <section
          data-index={1}
          ref={(el) => (sections.current[1] = el)}
          className="snap-section min-h-screen flex flex-col justify-center items-center px-6 py-12 md:py-20 snap-start"
        >
          <h2 className="text-3xl md:text-6xl font-black mb-8 md:mb-16 opacity-0 feature-text">The Essentials</h2>
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 w-full max-h-[70vh] md:max-h-none overflow-y-auto md:overflow-visible pr-2 md:pr-0 overscroll-contain pb-4">
            <div className="p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors opacity-0 delay-100 feature-text">
              <FaHistory className="text-xl md:text-4xl mb-4 md:mb-6 bg-gradient-primary p-2 rounded-xl text-white" />
              <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-4">TGA History</h3>
              <p className="font-bold text-white/60 text-sm md:text-base leading-relaxed">Discover or re-discover every game awarded at The Game Awards ceremonies since 2015. Every year, every category, every nominee and winner.</p>
            </div>
            <div className="p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors opacity-0 delay-200 feature-text">
              <FaGamepad className="text-xl md:text-4xl mb-4 md:mb-6 bg-gradient-secondary p-2 rounded-xl text-white" />
              <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-4">IGDB Integration</h3>
              <p className="font-bold text-white/60 text-sm md:text-base leading-relaxed">Detailed data from IGDB including covers, screenshots, videos, times to beat and events. All the facts you need, in one place.</p>
            </div>
            <div className="p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors opacity-0 delay-200 feature-text">
              <FaSearch className="text-xl md:text-4xl mb-4 md:mb-6 bg-gradient-secondary p-2 rounded-xl text-white" />
              <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-4">Custom News Watch</h3>
              <p className="font-bold text-white/60 text-sm md:text-base leading-relaxed">Never miss a headline. Game Track follows major gaming outlets and reporters, aggregating the latest news in one sleek feed.</p>
            </div>
            <div className="p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors opacity-0 delay-300 feature-text">
              <FaCalendarAlt className="text-xl md:text-4xl mb-4 md:mb-6 bg-gradient-tertiary p-2 rounded-xl text-white" />
              <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-4">Personal Library</h3>
              <p className="font-bold text-white/60 text-sm md:text-base leading-relaxed">Track your games, share playtimes, and join the hype train with live countdowns for the most anticipated upcoming releases.</p>
            </div>
          </div>

          <button
            onClick={() => scrollTo(2)}
            className="mt-8 md:mt-12 text-white/40 hover:text-white flex flex-col items-center gap-2 opacity-0 delay-400 feature-text"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Join us</span>
            <FaArrowDown className="animate-bounce" />
          </button>
        </section>

        {/* ABOUT & ACCESS SECTION */}
        <section
          data-index={2}
          ref={(el) => (sections.current[2] = el)}
          className="snap-section min-h-screen flex items-center justify-center px-4 md:px-6 snap-start"
        >
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-8 md:gap-12 bg-white/5 backdrop-blur-3xl border border-white/10 p-8 md:p-20 rounded-3xl md:rounded-[3rem] shadow-2xl opacity-0 feature-text">
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-3xl md:text-7xl font-black tracking-tight leading-tight">Ready to play ?</h2>
              <p className="text-sm md:text-xl text-white/60 font-medium leading-relaxed max-w-2xl mx-auto">
                Game Track is a personal labor of love and passion for the industry. No ads, no fluff—just the data we and you, care about. Join our community and start tracking !
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
              <button
                onClick={() => scrollTo(0)}
                className="px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl bg-white/10 hover:bg-white/20 font-black flex items-center justify-center gap-3 transition-all active:scale-95 text-sm md:text-base"
              >
                <FaArrowUp /> Back to start
              </button>
              <button
                onClick={handleContinue}
                className="px-8 py-3 md:px-10 md:py-4 rounded-xl md:rounded-2xl bg-gradient-primary font-black flex items-center justify-center gap-3 md:gap-4 transition-all hover:scale-105 shadow-[0_0_40px_rgba(90,142,255,0.3)] active:scale-95 text-sm md:text-base"
              >
                Access Game Track
                <FaArrowRight />
              </button>
            </div>
          </div>
        </section>
      </div>

      <nav className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-3 md:gap-4 z-50 pointer-events-auto">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className="group relative flex items-center justify-center"
          >
            <div className={`size-2 md:size-2.5 rounded-full transition-all duration-500 ${active === i ? 'bg-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'bg-white/20 group-hover:bg-white/40'}`} />
            {active === i && (
              <motion.div
                layoutId="nav-glow"
                className="absolute size-5 md:size-6 border border-white/20 rounded-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </nav>

      <style>{`
        .snap-section.in-view .feature-text { 
          transform: translateY(0) !important; 
          opacity: 1 !important; 
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .feature-text { 
          transform: translateY(2rem); 
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}


