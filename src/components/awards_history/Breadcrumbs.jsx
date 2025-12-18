import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { deslugify, slugify } from "../../js/utils";
import { FaArrowRight, FaChevronDown } from "react-icons/fa";

const Breadcrumbs = ({ tga = [] }) => {
  const navigate = useNavigate();
  const { year, awardId } = useParams();
  const [isYearsOpen, setIsYearsOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const yearsRef = useRef(null);
  const categoriesRef = useRef(null);

  const handleYearChange = (selectedYear) => {
    setIsYearsOpen(false);
    if (awardId) {
      navigate(`/game-awards-history/${selectedYear}/${awardId}`);
    } else {
      navigate(`/game-awards-history/${selectedYear}`);
    }
  };

  const handleCategoryChange = (selectedAwardId) => {
    selectedAwardId = slugify(selectedAwardId);
    setIsCategoriesOpen(false);
    if (year) {
      navigate(`/game-awards-history/${year}/${selectedAwardId}`);
    } else {
      navigate(`/game-awards-history/${selectedAwardId}`);
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearsRef.current && !yearsRef.current.contains(event.target)) {
        setIsYearsOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
        setIsCategoriesOpen(false);
      }
    };

    if (isYearsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    if (isCategoriesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isYearsOpen, isCategoriesOpen]);

  const sortedYears = [...tga].sort((a, b) => b.year - a.year);
  const filteredAwards = tga.find((tgaItem) => tgaItem.year.toString() === year)?.awards || [];

  return (
    <div className="flex items-center space-x-1 text-sm px-4">
      {/* Years */}
      {!year && !awardId ? (
        <></>
      ) : (
        <Link
          to="/game-awards-history"
          className="bg-gradient-primary rounded px-3 py-1 font-semibold hover:scale-105 transition"
        >
          History Home
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
              className="bg-gradient-primary rounded px-3 py-1 font-semibold hover:scale-105 transition"
            >
              {year}
            </Link>
            <button
              type="button"
              onClick={() => setIsYearsOpen(!isYearsOpen)}
              className="bg-gradient-primary rounded px-2 py-1.5 hover:scale-105 transition"
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
                      className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-gradient-primary transition duration-200"
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
        <div className="relative flex flex-row items-center gap-1" ref={categoriesRef}>
          <div
            className="bg-gradient-primary rounded px-3 py-1 font-semibold pointer-events-none"
          >
            {deslugify(awardId)}
          </div>
          <button
            type="button"
            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
            className="bg-gradient-primary rounded px-2 py-1.5 font-semibold"
          >
            <FaChevronDown className={`text-base transition-transform ${isCategoriesOpen ? "rotate-180" : ""}`} />
          </button>
          {isCategoriesOpen && (
            <div className="absolute top-full left-0 mt-1 bg-background rounded-md shadow-lg z-50 max-h-60 overflow-y-auto min-w-full border border-gray-700">
              {filteredAwards
                .filter((award) => award.title !== deslugify(awardId))
                .map((award) => (
                  <button
                    key={award.id}
                    type="button"
                    onClick={() => handleCategoryChange(award.title)}
                    className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-gradient-primary transition duration-200"
                  >
                    {award.title}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Breadcrumbs;
