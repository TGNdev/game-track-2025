import { Link, useParams } from "react-router-dom";
import { deslugify } from "../../js/utils";
import { FaArrowRight } from "react-icons/fa";

const Breadcrumbs = () => {
  const { year, awardId } = useParams();

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
          <Link
            to={`/game-awards-history/${year}`}
            className="bg-gradient-primary rounded px-3 py-1 text-white font-semibold hover:scale-105 transition"
          >
            {year}
          </Link>
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
