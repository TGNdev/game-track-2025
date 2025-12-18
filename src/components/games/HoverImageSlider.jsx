import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa6";
import { IoPauseOutline, IoPlayOutline } from "react-icons/io5";
import ScreenshotSkeleton from "../skeletons/ScreenshotSkeleton";

function HoverImageSlider({ images, bounds, isVisible, onClose }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState({ top: 0, left: 0 });
  const [loadedImages, setLoadedImages] = useState({});
  const allImagesLoaded = images.length > 0 && images.every((_, i) => loadedImages[i]);

  const intervalRef = useRef(null);
  const containerRef = useRef(null);

  const width = 320;
  const height = 180;

  const restartInterval = useCallback(() => {
    clearInterval(intervalRef.current);
    if (images.length <= 1 || !isVisible || isPaused || !allImagesLoaded) return;

    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
  }, [images, isPaused, isVisible, allImagesLoaded]);

  useEffect(() => {
    if (isVisible) setIndex(0);
  }, [isVisible]);

  useEffect(() => {
    restartInterval();
    return () => clearInterval(intervalRef.current);
  }, [restartInterval]);

  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) onClose();
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

  if (!bounds || images.length === 0) return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[9998] bg-black pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ backdropFilter: "blur(4px)" }}
          />

          {/* Slider */}
          <motion.div
            key="slider"
            ref={containerRef}
            onMouseLeave={onClose} // <- no timeout needed; AnimatePresence handles exit
            className="absolute rounded overflow-hidden shadow-2xl bg-black z-[9999]"
            style={{
              width,
              height,
              top: adjustedPosition.top,
              left: adjustedPosition.left,
              transform: "scale(1.5)",
              transformOrigin: "left center",
              pointerEvents: "auto",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {images.map((img, i) => (
              <div key={i} className="absolute top-0 left-0 w-full h-full">
                {!loadedImages[i] && <ScreenshotSkeleton />}
                <img
                  src={img}
                  alt={`Screenshot ${i + 1}`}
                  loading="lazy"
                  onLoad={() => setLoadedImages((prev) => ({ ...prev, [i]: true }))}
                  className={`w-full h-full object-cover absolute top-0 left-0 transition-opacity duration-700 ease-in-out border-primary bg-background ${
                    i === index && loadedImages[i] ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-gradient-primary p-1 rounded-full z-20"
                >
                  <FaChevronLeft size={20} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex((prev) => (prev + 1) % images.length);
                    restartInterval();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-primary p-1 rounded-full z-20"
                >
                  <FaChevronRight size={20} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPaused((prev) => !prev);
                  }}
                  className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-gradient-primary p-1 rounded-full z-20"
                >
                  {isPaused ? <IoPlayOutline size={14} /> : <IoPauseOutline size={14} />}
                </button>

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-background py-0.5 px-1 rounded-xl">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`block size-1 rounded-full transition-all duration-200 ${
                        i === index ? "bg-white scale-125 shadow" : "bg-white/40"
                      }`}
                      style={{
                        boxShadow: i === index ? "0 0 4px 2px rgba(255,255,255,0.6)" : undefined,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.getElementById("image-portal-root")
  );
}

export default HoverImageSlider;
