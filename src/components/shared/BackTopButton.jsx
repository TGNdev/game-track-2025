import { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-7 right-7 bg-gradient-primary flex justify-center items-center text-lg
        rounded-full shadow-lg size-14 sm:w-32 transition-all duration-300 ease-in-out transform
        ${isVisible ? "opacity-100 translate-y-0 z-50" : "opacity-0 translate-y-5 pointer-events-none"}`}
      aria-label="Back to top"
    >
      <div className="hidden sm:block">Back to top</div>
      <FaArrowUp className="block sm:hidden" />
    </button>
  );
}
