import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowDown, FaArrowRight, FaArrowUp } from "react-icons/fa";

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
    const opts = { root: containerRef.current, threshold: 0.55 };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const idx = Number(entry.target.getAttribute("data-index")) || 0;
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
    <div className="relative h-screen w-full">
      <div
        ref={containerRef}
        style={{ scrollSnapType: "y mandatory", scrollBehavior: "smooth" }}
        className="h-full overflow-y-auto"
      >
        <section
          data-index={0}
          ref={(el) => (sections.current[0] = el)}
          className="snap-section h-screen flex items-center justify-center px-6"
          style={{ scrollSnapAlign: "start" }}
        >
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-4">
            <h1 className="text-5xl font-extrabold mb-4 transform opacity-0 translate-y-6 transition-all duration-700 ">
              Welcome to<br />Game Track
            </h1>
            <img
              src="/logo.png"
              alt="Game Track logo"
              className="w-48 mx-auto mb-4 transform opacity-0 translate-y-6 transition-all duration-700 skew-y-12"
            />
            <p className="text-lg mb-6 max-w-2xl transform opacity-0 translate-y-6 transition-all duration-700">
              Game Track brings together upcoming and past video game releases with extra metadata, Game Awards history,
              and community highlights, all in one simple interface, no over-the-top useless features.
            </p>
            <div className="flex justify-center gap-3 mt-6 transform opacity-0 translate-y-6 transition-all duration-700">
              <button
                onClick={() => scrollTo(active + 1)}
                className="px-4 py-2 rounded border flex items-center gap-3"
              >
                <p>See features</p>
                <FaArrowDown className="animate-bounce" />
              </button>
            </div>
          </div>
        </section>

        <section
          data-index={1}
          ref={(el) => (sections.current[1] = el)}
          className="snap-section h-screen flex flex-col gap-10 justify-center items-center px-6"
          style={{ scrollSnapAlign: "start" }}
        >
          <h1 className="text-5xl font-extrabold mb-4 transform opacity-0 translate-y-6 transition-all duration-700">
            Main Features
          </h1>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="border-primary rounded-lg shadow transform opacity-0 translate-y-6 transition-all duration-700">
              <div className="p-5">
                <h3 className="font-semibold mb-4 text-lg">Game Details</h3>
                <p className="text-sm italic">View images, screenshots, and more for every game,
                  thanks to the data provided by IGDB.</p>
              </div>
            </div>
            <div className="border-primary rounded-lg shadow transform opacity-0 translate-y-6 transition-all duration-700">
              <div className="p-5">
                <h3 className="font-semibold mb-4 text-lg">History of The Game Awards</h3>
                <p className="text-sm italic">Explore complete lists of categories, nominees and winners of past Game Awards ceremonies, all in one place.</p>
              </div>
            </div>
            <div className="border-primary rounded-lg shadow transform opacity-0 translate-y-6 transition-all duration-700">
              <div className="p-5">
                <h3 className="font-semibold mb-4 text-lg">Release Calendar</h3>
                <p className="text-sm italic">Browse upcoming and past games & events in calendar views.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-3 mt-6 transform opacity-0 translate-y-6 transition-all duration-700">
            <button
              onClick={() => scrollTo(active + 1)}
              className="px-4 py-2 rounded border flex items-center gap-3"
            >
              <p>About</p>
              <FaArrowDown className="animate-bounce" />
            </button>
          </div>
        </section>

        <section
          data-index={2}
          ref={(el) => (sections.current[2] = el)}
          className="snap-section h-screen flex items-center justify-center px-6"
          style={{ scrollSnapAlign: "start" }}
        >
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-4">
            <h1 className="text-5xl font-extrabold mb-4 transform opacity-0 translate-y-6 transition-all duration-700">
              About Game Track
            </h1>
            <div className="mt-8 flex justify-center gap-3 transform opacity-0 translate-y-6 transition-all duration-700">
              <p className="text-lg mb-6 max-w-2xl">
                <b>Game Track</b> is a personal project created by two friends who are passionate about the video game industry.
                They wanted a simple way to find important information about major game releases and a complete history of the
                Game Awards without having to search through difficult-to-find data, as you typically have to do now.
                Built with React, Netlify and IGDB, Game Track aims to provide a clean and efficient user experience for fellow gamers.
              </p>
            </div>
            <div className="mt-8 flex justify-center gap-3 transform opacity-0 translate-y-6 transition-all duration-700">
              <button
                onClick={() => scrollTo(0)}
                className="px-4 py-2 rounded border flex items-center gap-3"
              >
                <FaArrowUp className="animate-bounce" />
                <p>Back to top</p>
              </button>
              <button
                onClick={handleContinue}
                className="px-4 py-2 rounded bg-gradient-primary flex items-center gap-3"
              >
                Access Game Track
                <FaArrowRight />
              </button>
            </div>
          </div>
        </section>
      </div>

      <nav className="hidden md:flex flex-col gap-3 fixed right-6 top-1/2 transform -translate-y-1/2 bg-background rounded-xl p-2">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Go to section ${i + 1}`}
            className={`size-3 rounded-full transition-all duration-500 ${active === i ? 'bg-gradient-tertiary' : 'bg-white/40 hover:scale-110'}`}
          />
        ))}
      </nav>

      <style>{`
        .snap-section.in-view .transform { transform: none !important; opacity: 1 !important; }
        .snap-section .transform { opacity: 0; transform: translateY(24px); }
      `}</style>
    </div>
  );
}


