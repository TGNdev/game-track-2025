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

const WatchCard = ({ article, onEdit, onDelete, canEdit, isHighlighted }) => {
  const formattedDate = new Date(article.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <motion.div
      id={article.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`group relative border rounded-3xl p-6 md:p-8 hover:bg-white/[0.08] transition-all duration-500 shadow-xl scroll-mt-32 min-w-0 ${isHighlighted
        ? "border-primary-light bg-white/[0.1] shadow-[0_0_30px_rgba(176,105,255,0.2)]"
        : "bg-white/5 border-white/10"
        }`}
    >
      {canEdit && (
        <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => onEdit(article)}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all hover:scale-110 shadow-lg backdrop-blur-md border border-white/10"
            title="Edit Article"
          >
            <FiEdit2 size={18} />
          </button>
          <button
            onClick={() => onDelete(article.id)}
            className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-500 transition-all hover:scale-110 shadow-lg backdrop-blur-md border border-red-500/20"
            title="Delete Article"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      )}

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
        {article.gameName ? (
          article.gameId ? (
            <Link
              to={`/games/${slugify(article.gameName)}`}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-50 hover:translate-x-1 hover:-translate-y-[3px] transition-transform"
            >
              <span>{article.gameName}</span>
              <FiExternalLink size={14} />
            </Link>
          ) : (
            <div className="text-xs font-black uppercase tracking-widest">
              <span>About {article.gameName}</span>
            </div>
          )
        ) : (
          <div />
        )}
        <h3 className="text-xl md:text-2xl font-black text-white leading-tight group-hover:text-primary-light transition-colors">
          {article.title}
        </h3>
        <div className="flex items-center gap-2 text-white/50 text-xs font-bold">
          <div className="size-6 rounded-lg bg-white/10 flex items-center justify-center">
            <FiUser size={14} />
          </div>
          <span>Reported by <span className="text-white">{article.author}</span></span>
        </div>
        <div className="">
          <div
            className="prose prose-invert text-white/70 text-sm md:text-base"
            dangerouslySetInnerHTML={{ __html: article.summary }}
          />
        </div>
        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 mt-auto">
          <a
            href={article.source}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors group/link"
          >
            <span>Original Source</span>
            <FiExternalLink size={14} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default WatchCard;
