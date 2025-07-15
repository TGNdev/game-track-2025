import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import CoverSkeleton from "../skeletons/CoverSkeleton";
import { useGame } from "../../contexts/GameContext";

function GamePreviewModal({ game, bounds, isVisible, onClose }) {
  const [isFadingIn, setIsFadingIn] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [shouldRender, setShouldRender] = useState(isVisible);
  const containerRef = useRef(null);
  const {
    getPlatformsSvg,
  } = useGame();

  const width = 240;
  const height = 320;
  const padding = 64;

  const [adjustedPosition, setAdjustedPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setIsFadingOut(false);
      requestAnimationFrame(() => {
        setIsFadingIn(true);
      });
    }
  }, [isVisible]);

  useEffect(() => {
    if (!bounds) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = bounds.left;
    let top = bounds.top;

    if (left + width > viewportWidth - padding) {
      left = Math.max(padding, viewportWidth - width - padding);
    }

    if (top + height > viewportHeight - padding) {
      top = Math.max(padding, viewportHeight - height - padding);
    }

    setAdjustedPosition({ top, left });
  }, [bounds]);

  const handleClose = () => {
    setIsFadingOut(true);
    setIsFadingIn(false);
    setTimeout(() => {
      onClose();
      setShouldRender(false);
    }, 300);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        handleClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible]);

  if (!game || !shouldRender) return null;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[9998] bg-black transition-opacity duration-300 ease-in-out pointer-events-none ${isFadingOut ? "opacity-0" : isFadingIn ? "opacity-50 backdrop-blur-sm" : "opacity-0"
          }`}
      />
      <div
        ref={containerRef}
        className={`absolute bg-white rounded-lg shadow-xl z-[9999] transition-opacity duration-300 ease-in-out
          ${isFadingOut ? "opacity-0" : isFadingIn ? "opacity-100" : "opacity-0"}`}
        style={{
          width: `${width}px`,
          top: `${adjustedPosition.top}px`,
          left: `${adjustedPosition.left}px`,
          pointerEvents: "auto",
        }}
      >
        <div className="relative">
          {game.cover ? (
            <img
              src={game.cover}
              alt={game.name}
              className="w-full h-auto object-cover rounded-t-lg"
            />
          ) : (
            <CoverSkeleton />
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-base mb-1">{game.name}</h3>
          <div className="flex flex-row gap-2 justify-center flex-wrap">
            {Object.keys(game.platforms)
              .filter((platform) => game.platforms[platform])
              .sort()
              .map((platform) => (
                <div key={platform}>{getPlatformsSvg(platform)}</div>
              ))}
            {Object.values(game.platforms).every((value) => !value) && (
              <span className="text-sm">TBA</span>
            )}
          </div>
        </div>
      </div>
    </>,
    document.getElementById("image-portal-root")
  );
}

export default GamePreviewModal;
