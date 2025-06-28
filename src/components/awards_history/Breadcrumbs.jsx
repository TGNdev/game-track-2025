import { Link, useParams } from "react-router-dom";
import { deslugify } from "../../js/utils";

const Breadcrumbs = () => {
  const { year, awardId } = useParams();

  return (
    <div className="text-sm px-4 text-gray-600">
      {!year && !awardId ? (
        <span>Years</span>
      ) : (
        <Link to="/game-awards-history" className="underline">Years</Link>
      )}
      {year && !awardId ? (
        <span> / {year}</span>
      ) : (
        <> / <Link to={`/game-awards-history/${year}`} className="underline">{year}</Link></>
      )}
      {awardId && (
        <> / <span>{deslugify(awardId)}</span></>
      )}
    </div>
  );
};

export default Breadcrumbs;