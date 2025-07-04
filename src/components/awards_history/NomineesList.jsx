import { motion } from 'framer-motion';

const NomineeList = ({ award, getGameById }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="px-4 py-6"
    >
      <h3 className="text-xl font-bold mb-6">{award.title}</h3>

      <div className="flex flex-wrap gap-4 justify-center">
        {award.nominees && award.nominees.length > 0 ? (
          award.nominees.map((nominee, idx) => {
            const game = getGameById(nominee.gameId);

            return (
              <div
                key={idx}
                className={`w-72 h-auto flex-shrink-0 ${nominee.isWinner
                  ? ''
                  : 'bg-white rounded-xl shadow-sm border text-center flex flex-col items-center border-gray-200 opacity-65'
                  }`}
                id={nominee.isWinner ? 'winner' : ''}
              >
                {nominee.role ? (
                  <>
                    <div className='mb-2'>
                      <div className="text-xl font-medium mt-2">{nominee.role.actor.name}</div>
                      <div className="text-lg text-gray-500">
                        <span className='text-base'>as </span>
                        {nominee.role.as.name}
                      </div>
                    </div>
                    <img
                      src={nominee.role.actor.image}
                      alt={nominee.role.actor.name}
                      className="object-cover h-72 w-full rounded"
                    />
                    <div className="text-sm text-gray-500 my-2">{game.name}</div>
                  </>
                ) : game ? (
                  <>
                    {game.cover && (
                      <img
                        src={game.cover}
                        alt={game.name}
                        className="object-cover h-52 w-full rounded"
                      />
                    )}
                    <div className="flex-1 flex items-center justify-center py-2">
                      <div className="text-xl font-medium text-center">{game.name}</div>
                    </div>
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
                className="w-96 h-auto flex-shrink-0 bg-white rounded-xl shadow-sm border text-center flex flex-col items-center border-gray-200"
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
