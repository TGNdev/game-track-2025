import { motion } from 'framer-motion';

const NomineeList = ({ award, getGameById, onBackToAwards, onBackToYears }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="px-4 py-6"
    >
      <div className="flex justify-between mb-4">
        <button onClick={onBackToAwards} className="text-blue-500 hover:underline">
          ← Back to categories
        </button>
        <button onClick={onBackToYears} className="text-blue-500 hover:underline">
          ← Back to years
        </button>
      </div>

      <h3 className="text-xl font-bold mb-6">{award.title}</h3>

      <div className="flex flex-wrap gap-4 justify-center">
        {award.nominees && award.nominees.length > 0 ? (
          award.nominees.map((nominee, idx) => {
            const game = getGameById(nominee.gameId);

            return (
              <div
                key={idx}
                className={`${!nominee.isWinner && "bg-white rounded-xl shadow-sm border text-center flex flex-col items-center border-gray-200 opacity-65"} w-64 h-64`}
                id={nominee.isWinner ? 'winner' : ''}
              >
                {nominee.role ? (
                  <>
                    <div className="text-xl font-medium mt-2">{nominee.role.actor.name}</div>
                    <div className="text-lg text-gray-500">{nominee.role.as.name}</div>
                    <img
                      src={nominee.role.actor.image}
                      alt={nominee.role.actor.name}
                      className="object-cover rounded mb-1"
                    />
                    <div className="text-sm text-gray-500 my-2">{game.name}</div>
                  </>
                ) : game ? (
                  <>
                    {game.cover && (
                      <img
                        src={game.cover}
                        alt={game.name}
                        className="object-cover h-full rounded"
                      />
                    )}
                    <div className="text-xl font-medium my-2">{game.name}</div>
                  </>
                ) : (
                  <p className="text-red-500 text-sm">Game not found</p>
                )}
              </div>
            );
          })
        ) : (
          (() => {
            const game = getGameById(award.gameId);
            if (!game) {
              return <p className="text-red-500 text-sm">Game not found</p>;
            }
            return (
              <div
                key={award.gameId}
                id="winner"
              >
                {game.cover && (
                  <img
                    src={game.cover}
                    alt={game.name}
                    className="object-cover h-full rounded"
                  />
                )}
                <div className="text-xl font-medium my-2">{game.name}</div>
              </div>
            );
          })()
        )}
      </div>
    </motion.div>
  );
};

export default NomineeList;
