import { motion } from "framer-motion";

const AwardSelector = ({ year, onSelectAward, onBack }) => {
  const awards = [...year.awards].sort((a, b) => a.order - b.order);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="px-4 py-6"
    >
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <button
              onClick={onBack}
              className="hover:underline text-blue-500 focus:outline-none"
            >
              Years
            </button>
          </li>
          <li>
            <span className="mx-1">/</span>
          </li>
          <li className="font-semibold text-gray-900">{year.year}</li>
        </ol>
      </nav>
      <h3 className="text-xl font-bold self-start mb-6">Choose an Award</h3>
      <div className="flex flex-wrap gap-4 justify-center">
        {awards.map((award, idx) => (
          <button
            key={idx}
            onClick={() => onSelectAward(award)}
            className="size-24 sm:size-40 flex items-center justify-center border-2 p-4 rounded-md hover:bg-gray-100 hover:scale-105 transition-all"
          >
            <span className="text-sm sm:text-lg font-medium">{award.title}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default AwardSelector;