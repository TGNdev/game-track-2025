import { motion } from 'framer-motion';

const NomineeList = ({ award, getGameById, coverMap }) => {
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
            const cover = coverMap ? coverMap[game.igdb_id] : [];

            return (
              <div
                key={idx}
                className={`w-72 h-auto flex-shrink-0 ${!nominee.isWinner && 
                  'rounded-xl shadow-sm  border-primary text-center flex flex-col items-center opacity-40'
                }`}
                id={nominee.isWinner ? 'winner' : ''}
              >
                {nominee.role ? (
                  <>
                    <div className='mb-2'>
                      <div className="text-xl font-medium mt-2">{nominee.role.actor.name}</div>
                      <div className="text-lg">
                        <span className='text-sm italic'>as </span>
                        {nominee.role.as.name}
                      </div>
                    </div>
                    <img
                      src={nominee.role.actor.image}
                      alt={nominee.role.actor.name}
                      className="object-cover h-72 w-full rounded-t-lg"
                    />
                    <div className="text-sm my-2 italic">{game.name}</div>
                  </>
                ) : game ? (
                  <>
                    {cover && (
                      <img
                        src={cover}
                        alt={game.name}
                        className="object-cover h-auto w-full rounded-t-lg"
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
        ) : award.description ? (
          (() => {
            return (
              <div className='flex flex-col gap-6 items-center justify-center'>
                <p className='text-center italic font-light'>{award.description}</p>
                <div
                  key={award.name}
                  className="w-auto h-auto flex-shrink-0 bg-background rounded-xl shadow-sm text-center flex flex-col items-center"
                  id="winner"
                >
                  <img
                    src={award.image}
                    alt={award.name}
                    className="object-cover h-96 rounded-lg"
                  />
                  <div className="text-xl font-medium my-2">{award.name}</div>
                </div>
              </div>
            );
          })()
        ) : (
          (() => {
            const game = getGameById(award.gameId);
            const cover = coverMap ? coverMap[game.igdb_id] : []
            if (!game) {
              return <p className="text-red-500 text-sm">Game not found</p>;
            }
            return (
              <div
                key={award.gameId}
                className="w-auto h-auto flex-shrink-0 bg-background rounded-xl shadow-sm text-center flex flex-col items-center"
                id="winner"
              >
                {game.cover && (
                  <img
                    src={cover}
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
