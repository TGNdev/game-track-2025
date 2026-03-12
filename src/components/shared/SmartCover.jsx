import { useState, useEffect } from "react";
import CoverSkeleton from "../skeletons/CoverSkeleton";

const SmartCover = ({ src, alt, className, showSkeleton = true }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let timer;
    if (!loaded && !error) {
      timer = setTimeout(() => {
        setTimedOut(true);
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [loaded, error]);

  const handleLoad = () => {
    setLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  // If we have an error or a timeout AND it's still not loaded, use fallback
  const useFallback = error || (timedOut && !loaded);
  
  // We explicitly use a fallback if the src is missing or if we timed out/errored
  const finalSrc = !src || useFallback ? "logo.png" : src;

  return (
    <div className={`relative overflow-hidden bg-white/5 flex items-center justify-center ${className}`}>
      {showSkeleton && !loaded && !useFallback && <CoverSkeleton />}
      <img
        src={finalSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full transition-opacity duration-500 ${useFallback ? "object-contain p-8 opacity-40" : "object-cover opacity-100"} ${loaded || useFallback ? "" : "opacity-0"}`}
      />
    </div>
  );
};

export default SmartCover;
