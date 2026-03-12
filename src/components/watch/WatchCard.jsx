import { useRef, useState } from "react";
import { motion, useScroll } from "framer-motion";
import { FiExternalLink, FiUser, FiCalendar, FiEdit2, FiTrash2, FiLink } from "react-icons/fi";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { slugify } from "../../js/utils";
import DOMPurify from "dompurify";

const WatchCard = ({ article, onEdit, onDelete, canEdit, isHighlighted }) => {
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = new Date(article.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#/industry-watch?id=${article.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <motion.div
      id={article.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`group relative border rounded-3xl p-4 md:p-6 hover:bg-white/[0.08] transition-all duration-500 shadow-xl scroll-mt-32 min-w-0 flex flex-col h-[480px] md:h-[520px] ${isHighlighted
        ? "border-white/40 bg-white/[0.1] shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        : "bg-white/5 border-white/10"
        }`}
    >
      <div className="flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between shrink-0 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            {article._type === 'rss' ? (
              <div className="flex flex-wrap">
                {article.articles?.map((a, i) => (
                  <a
                    key={i}
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors group/link"
                  >
                    <span>{a.source}</span>
                    <FiExternalLink size={10} />
                  </a>
                ))}
              </div>
            ) : (
              <a
                href={article.source}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors group/link"
              >
                <span>Original Source</span>
                <FiExternalLink size={14} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest">
              <FiCalendar size={12} />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all shadow-lg backdrop-blur-md border border-white/10"
                title="Copy Link"
              >
                <FiLink size={14} />
              </button>
              {canEdit && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(article)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all shadow-lg backdrop-blur-md border border-white/10"
                    title="Edit Article"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  {article._type !== 'rss' && (
                    <button
                      onClick={() => onDelete(article.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500/60 hover:text-red-500 transition-all shadow-lg backdrop-blur-md border border-red-500/10"
                      title="Delete Article"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 space-y-3">
          {article.gameName && (
            article.gameId ? (
              <Link
                to={`/games/${slugify(article.gameName)}`}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-50 hover:translate-x-1 hover:-translate-y-[3px] transition-transform w-fit"
              >
                <span>{article.gameName}</span>
                <FiExternalLink size={14} />
              </Link>
            ) : (
              <div className="text-xs font-black uppercase tracking-widest opacity-50">
                <span>About {article.gameName}</span>
              </div>
            )
          )}
          <h3 className={`text-xl md:text-2xl font-black text-white leading-tight group-hover:text-white transition-colors ${isExpanded ? "line-clamp-none" : "line-clamp-2"}`}>
            {article.title}
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-black uppercase tracking-widest opacity-50 transition-all w-fit hover:opacity-100 hover:scale-105"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
          <div className="flex items-center gap-2 text-white/50 text-xs font-bold">
            <div className="size-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <FiUser size={14} />
            </div>
            <span className="truncate">Reported by <span className="text-white">
              {article._type === 'rss'
                ? Array.from(new Set(article.articles?.map(a => a.source))).join(", ")
                : article.author}
            </span></span>
          </div>

          <div className="h-[6px] w-full bg-white/10 overflow-hidden rounded-full mt-4">
            <motion.div
              className="h-full bg-gradient-primary origin-left"
              style={{ scaleX: scrollYProgress }}
            />
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <div
            className="prose max-w-none prose-invert text-white/70 text-sm md:text-base pb-2"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.summary) }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default WatchCard;
