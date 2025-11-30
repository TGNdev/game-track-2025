import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { deslugify } from "../../js/utils";
import { FaArrowRight, FaChevronDown } from "react-icons/fa";

const Breadcrumbs = ({ tga = [] }) => {
  const { year, awardId } = useParams();
  const navigate = useNavigate();
  const [isYearsOpen, setIsYearsOpen] = useState(false);
  const yearsRef = useRef(null);

  const handleYearChange = (selectedYear) => {
    setIsYearsOpen(false);
    if (awardId) {
      // Navigate to the same category in the selected year
      navigate(`/game-awards-history/${selectedYear}/${awardId}`);
    } else {
      // Navigate to the selected year
      navigate(`/game-awards-history/${selectedYear}`);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearsRef.current && !yearsRef.current.contains(event.target)) {
        setIsYearsOpen(false);
      }
    };

    if (isYearsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isYearsOpen]);

  // Sort years in descending order (newest first)
  const sortedYears = [...tga].sort((a, b) => b.year - a.year);

  return (
    <div className="flex items-center space-x-1 text-sm px-4">
      {/* Years */}
      {!year && !awardId ? (
        <></>
      ) : (
        <Link
          to="/game-awards-history"
          className="bg-gradient-primary rounded px-3 py-1 text-white font-semibold hover:scale-105 transition"
        >
          Years
        </Link>
      )}

      {/* Separator */}
      {(year || awardId) && <FaArrowRight />}

      {/* Year */}
      {year && !awardId ? (
        <span className="border rounded px-3 py-1 font-semibold pointer-events-none">{year}</span>
      ) : (
        year && (
          <div className="relative flex flex-row items-center gap-1" ref={yearsRef}>
            <Link
              to={`/game-awards-history/${year}`}
              className="bg-gradient-primary rounded px-3 py-1 text-white font-semibold hover:scale-105 transition"
            >
              {year}
            </Link>
            <button
              type="button"
              onClick={() => setIsYearsOpen(!isYearsOpen)}
              className="bg-gradient-primary rounded px-3 py-1.5 text-white font-semibold hover:scale-105 transition"
            >
              <FaChevronDown className={`text-base transition-transform ${isYearsOpen ? "rotate-180" : ""}`} />
            </button>
            {isYearsOpen && (
              <div className="absolute top-full left-0 mt-1 bg-background rounded-md shadow-lg z-50 max-h-60 overflow-y-auto min-w-full border border-gray-700">
                {sortedYears
                  .filter((yearData) => yearData.year.toString() !== year)
                  .map((yearData) => (
                    <button
                      key={yearData.year}
                      type="button"
                      onClick={() => handleYearChange(yearData.year)}
                      className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-gradient-primary transition duration-200 text-white hover:text-white"
                    >
                      {yearData.year}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )
      )}

      {/* Separator */}
      {awardId && <FaArrowRight />}

      {/* Award */}
      {awardId && (
        <span className="border rounded px-3 py-1 font-semibold cursor-default">
          {deslugify(awardId)}
        </span>
      )}
    </div>
  );
};

export default Breadcrumbs;
