import { motion } from "framer-motion";
import { FiExternalLink, FiUser, FiCalendar, FiEdit2, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import { slugify } from "../../js/utils";

const categoryColors = {
  Rumor: "bg-amber-500/20 text-amber-500 border-amber-500/20",
  Confirmation: "bg-green-500/20 text-green-500 border-green-500/20",
  Layoffs: "bg-red-500/20 text-red-500 border-red-500/20",
  Closure: "bg-gray-500/20 text-gray-400 border-gray-500/20",
  Acquisition: "bg-purple-500/20 text-purple-500 border-purple-500/20",
  Legal: "bg-blue-500/20 text-blue-500 border-blue-500/20",
  Financial: "bg-emerald-500/20 text-emerald-500 border-emerald-500/20",
  Other: "bg-white/10 text-white/60 border-white/10"
};

const WatchCardSmall = ({ article }) => {
  const formattedDate = new Date(article.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="group relative bg-white/5 border border-white/10 rounded-3xl p-4 hover:bg-white/[0.08] transition-all duration-500 shadow-xl"
    >
      <div className="flex flex-col h-full space-y-6">
        <div className="flex items-center justify-between pr-24 md:pr-0">
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${categoryColors[article.category] || categoryColors.Other}`}>
            {article.category}
          </div>
          <div className="flex items-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest">
            <FiCalendar size={12} />
            <span>{formattedDate}</span>
          </div>
        </div>
        <h3 className="text-md md:text-lg font-black text-white leading-tight group-hover:text-primary-light transition-colors">
          {article.title}
        </h3>
        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 mt-auto">
          <Link
            to={`/industry-watch?id=${article.id}`}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary-light hover:text-white transition-colors group/link"
          >
            <span>Read full news</span>
            <FiExternalLink size={14} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default WatchCardSmall;
