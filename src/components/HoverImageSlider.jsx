import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa6";
import { IoPauseOutline, IoPlayOutline } from "react-icons/io5";

function HoverImageSlider({ images, bounds, isVisible, onClose }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFadingIn, setIsFadingIn] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [shouldRender, setShouldRender] = useState(isVisible);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);

  const width = 320;
  const height = 180;

  const restartInterval = () => {
    clearInterval(intervalRef.current);
    if (images.length <= 1 || !shouldRender || isPaused) return;
    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
  };

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsFadingOut(false);
      setIsFadingIn(false);
      requestAnimationFrame(() => {
        setIsFadingIn(true);
      });
    }
  }, [isVisible]);

  useEffect(() => {
    if (!shouldRender) return;
    restartInterval();
    return () => clearInterval(intervalRef.current);
  }, [shouldRender, isPaused]);

  const handleMouseLeave = () => {
    setIsFadingOut(true);
    setIsFadingIn(false);
    setTimeout(() => {
      onClose();
      setShouldRender(false);
    }, 300);
  };

  const handleMouseEnter = () => {
    setIsFadingOut(false);
  };

  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible, onClose]);

  if (!bounds || !shouldRender || images.length === 0) return null;

  return createPortal(
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`absolute rounded overflow-hidden shadow-2xl bg-black z-[9999] transition-opacity duration-300 ease-in-out 
        ${isFadingOut ? "opacity-0" : isFadingIn ? "opacity-100" : "opacity-0"}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        top: `${bounds.top}px`,
        left: `${bounds.left}px`,
        transform: "scale(1.5)",
        transformOrigin: "left center",
        pointerEvents: "auto",
      }}
    >
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          alt=""
          className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${i === index ? "opacity-100 z-10" : "opacity-0 z-0"}`}
        />
      ))}

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => (prev - 1 + images.length) % images.length);
              restartInterval();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/60 hover:bg-white text-black p-1 rounded-full pointer-events-auto z-20"
          >
            <FaChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => (prev + 1) % images.length);
              restartInterval();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/60 hover:bg-white text-black p-1 rounded-full pointer-events-auto z-20"
          >
            <FaChevronRight size={20} />
          </button>
        </>
      )}

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPaused((prev) => !prev);
          }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/70 hover:bg-white text-black p-1 rounded-full z-20"
        >
          {isPaused ? <IoPlayOutline size={14} /> : <IoPauseOutline size={14} />}
        </button>
      )}
    </div>,
    document.getElementById("image-portal-root")
  );
}

export default HoverImageSlider;
