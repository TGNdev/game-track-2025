import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa6";
import { IoPauseOutline, IoPlayOutline } from "react-icons/io5";

function HoverImageSlider({ images, bounds, isVisible, onClose }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFadingIn, setIsFadingIn] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [adjustedPosition, setAdjustedPosition] = useState({ top: 0, left: 0 });
  const [loadedImages, setLoadedImages] = useState({});
  const allImagesLoaded = images.length > 0 && images.every((_, i) => loadedImages[i]);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);

  const width = 320;
  const height = 180;

  const restartInterval = useCallback(() => {
    clearInterval(intervalRef.current);

    if (images.length <= 1 || !shouldRender || isPaused || !allImagesLoaded) return;

    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
  }, [images, isPaused, shouldRender, allImagesLoaded]);

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
  }, [shouldRender, isPaused, restartInterval]);

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

  useEffect(() => {
    if (!bounds) return;

    const padding = 64;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = bounds.left;
    let top = bounds.top;

    if (left + width * 1.5 > viewportWidth - padding) {
      left = Math.max(padding, viewportWidth - width * 1.5 - padding);
    }

    if (top + height > viewportHeight - padding) {
      top = Math.max(padding, viewportHeight - height - padding);
    }

    setAdjustedPosition({ top, left });
  }, [bounds]);

  if (!bounds || !shouldRender || images.length === 0) return null;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[9998] bg-black transition-opacity duration-300 ease-in-out pointer-events-none ${isFadingOut ? "opacity-0" : isFadingIn ? "opacity-50 backdrop-blur-sm" : "opacity-0"
          }`}
      />
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`absolute rounded overflow-hidden shadow-2xl bg-black z-[9999] transition-opacity duration-300 ease-in-out 
          ${isFadingOut ? "opacity-0" : isFadingIn ? "opacity-100" : "opacity-0"}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          top: `${adjustedPosition.top}px`,
          left: `${adjustedPosition.left}px`,
          transform: "scale(1.5)",
          transformOrigin: "left center",
          pointerEvents: "auto",
        }}
      >
        {images.map((img, i) => (
          <div key={i} className="absolute top-0 left-0 w-full h-full">
            {!loadedImages[i] && (
              <div className="w-full h-full bg-gray-300 animate-pulse absolute top-0 left-0 z-0" />
            )}
            <img
              src={img}
              alt={`Screenshot ${i + 1}`}
              loading="lazy"
              onLoad={() =>
                setLoadedImages((prev) => ({ ...prev, [i]: true }))
              }
              className={`w-full h-full object-cover absolute top-0 left-0 transition-opacity duration-700 ease-in-out ${i === index && loadedImages[i] ? "opacity-100 z-10" : "opacity-0 z-0"}`}
            />
          </div>
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
      </div>
    </>,
    document.getElementById("image-portal-root")
  );
}

export default HoverImageSlider;
