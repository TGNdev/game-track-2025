import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa6";
import { FaExpandAlt, FaCompressAlt } from "react-icons/fa";
import { IoPauseOutline, IoPlayOutline } from "react-icons/io5";
import ScreenshotSkeleton from "../skeletons/ScreenshotSkeleton";

function GameImageSlider({ images, bounds, isOpen, onClose }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState({ top: 0, left: 0 });
  const [loadedImages, setLoadedImages] = useState({});
  const allImagesLoaded = images.length > 0 && images.every((_, i) => loadedImages[i]);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);

  const width = 320;
  const height = 180;

  const restartInterval = useCallback(() => {
    clearInterval(intervalRef.current);
    if (images.length <= 1 || !isOpen || isPaused || !allImagesLoaded) return;
    intervalRef.current = setInterval(() => {
      setIndex((p) => (p + 1) % images.length);
    }, 3000);
  }, [images, isPaused, isOpen, allImagesLoaded]);

  useEffect(() => {
    if (isOpen) setIndex(0);
  }, [isOpen]);

  useEffect(() => {
    restartInterval();
    return () => clearInterval(intervalRef.current);
  }, [restartInterval]);

  useEffect(() => {
    if (!bounds) return;

    const gap = 12;
    const padding = 16;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const scaledW = width * 1.5;
    const scaledH = height * 1.5;

    let left = bounds.right + gap;
    if (left + scaledW > vw - padding) {
      left = bounds.left - gap - scaledW;
    }
    left = Math.max(padding, Math.min(left, vw - padding - scaledW));

    let top = bounds.top;
    top = Math.max(padding, Math.min(top, vh - padding - scaledH));

    setAdjustedPosition({ top, left });
  }, [bounds, width, height]);

  useEffect(() => {
    if (!isFullscreen) return;

    const onResize = () => {
      setAdjustedPosition((p) => ({ ...p }));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isFullscreen]);

  const getFullscreenRect = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const pad = 40;
    const maxW = Math.min(1200, vw - pad * 2);
    const maxH = Math.min(675, vh - pad * 2);

    let w = maxW;
    let h = (w * 9) / 16;
    if (h > maxH) {
      h = maxH;
      w = (h * 16) / 9;
    }

    return {
      width: w,
      height: h,
      left: (vw - w) / 2,
      top: (vh - h) / 2,
    };
  };

  const normal = adjustedPosition
    ? { top: adjustedPosition.top, left: adjustedPosition.left, width, height, scale: 1.5 }
    : null;

  const full = {
    ...getFullscreenRect(),
    scale: 1,
  };

  if (!isOpen || !bounds) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blocks background */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            style={{ pointerEvents: "auto" }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />

          {/* Slider */}
          <motion.div
            key="slider"
            ref={containerRef}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="fixed rounded overflow-hidden shadow-2xl bg-black z-[9999]"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              ...(isFullscreen ? full : normal),
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.2 },
              type: "spring",
              stiffness: 260,
              damping: 28,
              mass: 0.9,
            }}
            style={{
              transformOrigin: "left top",
            }}
          >
            {images.map((img, i) => (
              <div key={i} className="absolute top-0 left-0 w-full h-full">
                {!loadedImages[i] && <ScreenshotSkeleton />}
                <img
                  src={img}
                  alt={`Screenshot ${i + 1}`}
                  loading="lazy"
                  onLoad={() =>
                    setLoadedImages((prev) => ({ ...prev, [i]: true }))
                  }
                  className={`w-full h-full object-cover absolute top-0 left-0 transition-opacity duration-700 ease-in-out border-primary bg-background ${i === index && loadedImages[i]
                    ? "opacity-100 z-10"
                    : "opacity-0 z-0"
                    }`}
                />
              </div>
            ))}

            {/* Controls */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex((p) => (p - 1 + images.length) % images.length);
                    restartInterval();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-gradient-primary p-1 rounded-full z-20"
                >
                  <FaChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex((p) => (p + 1) % images.length);
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
                  className={`absolute left-1/2 -translate-x-1/2 bg-gradient-primary p-1 rounded-full z-20 ${isFullscreen ? "bottom-7" : "bottom-5"}`}
                  title={isPaused ? "Play slideshow" : "Pause slideshow"}
                >
                  {isPaused ? <IoPlayOutline size={isFullscreen ? 20 : 14} /> : <IoPauseOutline size={isFullscreen ? 20 : 14} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullscreen((prev) => !prev);
                  }}
                  className="absolute top-3 right-3 bg-gradient-primary p-1.5 rounded-full z-20"
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <FaCompressAlt size={isFullscreen ? 20 : 14} /> : <FaExpandAlt size={isFullscreen ? 20 : 14} />}
                </button>
                <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-background rounded-xl ${isFullscreen ? "py-1 px-2" : "py-0.5 px-1"}`}>
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`block ${isFullscreen ? "size-2" : "size-1"} rounded-full transition-all duration-200 ${i === index ? "bg-white scale-125 shadow" : "bg-white/40"
                        }`}
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

export default GameImageSlider;