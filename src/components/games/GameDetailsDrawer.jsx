import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { useGame } from "../../contexts/GameContext";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

const GameDetailsDrawer = () => {
  const [open, setOpen] = useState(false);
  const { gameToSee, setGameToSee } = useGame();

  useEffect(() => {
    if (gameToSee) {
      setOpen(true);
    }
  }, [gameToSee]);

  const closeDrawer = () => {
    setOpen(false);
    setTimeout(() => {
      setGameToSee(null);
    }, 300);
  };

  const formatDate = (timestamp) => {
    try {
      if (timestamp instanceof Timestamp) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString("en-EN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      }

      return timestamp
    } catch {
      return "Unknown";
    }
  };

  const getCoverUrl = (igdb_id) => {
    const key = `cover_${igdb_id}`;
    const item = localStorage.getItem(key);

    if (!item) return null;

    try {
      const parsed = JSON.parse(item);
      const now = Date.now();
      if (parsed.expiresAt && parsed.expiresAt > now) {
        return parsed.value;
      }
      return null;
    } catch {
      return null;
    }
  };

  const getRandomScreenshotUrl = (igdb_id) => {
    const key = `screenshots_${igdb_id}`;
    const item = localStorage.getItem(key);
    if (!item) return null;

    try {
      const parsed = JSON.parse(item);
      const now = Date.now();
      if (parsed.expiresAt && parsed.expiresAt > now && Array.isArray(parsed.value)) {
        const screenshots = parsed.value;
        if (screenshots.length > 0) {
          const randomIndex = Math.floor(Math.random() * screenshots.length);
          return screenshots[randomIndex];
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const renderPlatforms = (platforms) => {
    return Object.entries(platforms)
      .filter(([_, enabled]) => enabled)
      .map(([platform]) => platform.toUpperCase())
      .join(" / ");
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        aria-hidden="true"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-2/3 bg-white text-lg shadow-lg z-50 transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"
          }`}
        aria-label="Navigation drawer"
      >
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 p-2 rounded-full bg-gradient-primary transition hover:scale-110 z-10"
          onClick={closeDrawer}
          aria-label="Close navigation drawer"
        >
          <FiX size={24} />
        </button>

        <div className="flex flex-col gap-6">
          {gameToSee && (
            <>
              <div className="relative h-ful w-full overflow-hidden">
                <img
                  src={getRandomScreenshotUrl(gameToSee.igdb_id)}
                  alt="Background"
                  className="absolute inset-0 w-full h-full object-cover blur-md scale-110 brightness-75"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
              </div>

              {/* Cover Image */}
              {getCoverUrl(gameToSee.igdb_id) && (
                <img
                  src={getCoverUrl(gameToSee.igdb_id)}
                  alt={`${gameToSee.name} cover`}
                  className="w-1/2 h-auto object-cover rounded-lg"
                />
              )}

              {/* Game Info */}
              <h2 className="text-2xl font-bold">{gameToSee.name}</h2>

              <p className="text-gray-600">
                Release Date: <strong>{formatDate(gameToSee.release_date)}</strong>
              </p>

              {gameToSee.url && (
                <p>
                  <a
                    href={gameToSee.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Official Site
                  </a>
                </p>
              )}

              {/* Platforms */}
              {gameToSee.platforms && (
                <p className="text-sm">
                  Platforms:{" "}
                  <span className="font-semibold">{renderPlatforms(gameToSee.platforms)}</span>
                </p>
              )}

              {/* Developers */}
              {gameToSee.developers?.length > 0 && (
                <div>
                  <p className="font-semibold">Developers:</p>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {gameToSee.developers.map((dev, idx) => (
                      <li key={idx}>
                        <a
                          href={dev.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          {dev.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Editors */}
              {gameToSee.editors?.length > 0 && (
                <div>
                  <p className="font-semibold">Editors:</p>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {gameToSee.editors.map((ed, idx) => (
                      <li key={idx}>
                        <a
                          href={ed.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          {ed.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default GameDetailsDrawer;
