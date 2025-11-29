export default function FilterButton({ isVisible, filterCondition, onClick, text, extraClasses = "rounded-full" }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm font-bold hover:scale-105 duration-200 ${extraClasses} ${filterCondition
        ? "bg-gradient-primary"
        : ""
        }`}
      disabled={!isVisible}
      aria-label={text}
    >
      <div className="">{text}</div>
    </button>
  );
}
