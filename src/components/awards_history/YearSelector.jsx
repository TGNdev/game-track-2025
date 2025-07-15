import { motion } from "framer-motion";

const YearSelector = ({ tga, onSelectYear }) => {
  const tgaSorted = [...tga].sort((a, b) => a.year - b.year);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="px-4 py-6"
    >
      <h3 className="text-xl font-bold self-start mb-6">Choose a Game Awards year</h3>
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        {tgaSorted.map((yearData) => (
          <button
            key={yearData.id}
            onClick={() => onSelectYear(yearData)}
            className="size-24 sm:size-40 flex items-center justify-center border-primary p-4 rounded-md hover:scale-105 transition"
          >
            <span className="text-xl font-semibold">{yearData.year}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default YearSelector;