const TimesDisclaimer = ({ onClose }) => {
  return (
    <div className="relative bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 px-3 pt-3 pb-10 pr-10 rounded-md text-sm space-y-1 shadow-md">
      <button
        type="button"
        onClick={onClose}
        className="absolute bottom-2 right-2 text-sm font-semibold text-yellow-700 hover:text-yellow-900 hover:scale-105 transition"
      >
        Got it
      </button>

      <p className="font-medium">Estimated playtime</p>
      <p>These times represent the average hours required to complete the game.</p>
      <p>
        Please note: this data is contributed by the community (via IGDB) and may not reflect your personal experience exactly.
      </p>
    </div>
  );
};

export default TimesDisclaimer;
