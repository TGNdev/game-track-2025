export default function FilterButton({ isVisible, filterCondition, onClick, text, extraClasses = "rounded-xl" }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${extraClasses} ${filterCondition
          ? "bg-gradient-primary shadow-lg shadow-[#b069ff]/20 text-white scale-105"
          : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white"
        }`}
      disabled={!isVisible}
      aria-label={text}
    >
      <div>{text}</div>
    </button>
  );
}
