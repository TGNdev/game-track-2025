import { motion } from 'framer-motion';

const NomineeList = ({ award, getGameById, coverMap, awardYear }) => {
  const currentYear = new Date().getFullYear();
  const isCurrentYear = awardYear === currentYear;
  const allNomineesAreLosers = award.nominees && award.nominees.length > 0 && 
    award.nominees.every(nominee => !nominee.isWinner);
  const shouldShowOpacity = !(isCurrentYear && allNomineesAreLosers);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="px-4 py-6"
    >
      <h3 className="text-xl font-bold">{award.title}</h3>
      {!shouldShowOpacity && (
        <div className='w-full flex flex-row justify-center'>
          <p className='max-w-xl text-center text-lg mt-6'>
            Stay tuned! Winners will be announced at The Game Awards ceremony on December 12th !
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 justify-center mt-8">
        {award.nominees && award.nominees.length > 0 ? (
          award.nominees.map((nominee, idx) => {
            const game = getGameById(nominee.gameId);
            const cover = game && coverMap ? coverMap[game.igdb_id] : [];

            return (
              <div
                key={idx}
                className={`w-72 h-auto flex-shrink-0 rounded-xl shadow-sm text-center flex flex-col items-center ${!nominee.isWinner ? 'border-primary' : ''} ${!nominee.isWinner && shouldShowOpacity ? 'opacity-40' : ''}`}
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
                    {game && <div className="text-sm my-2 italic">{game.name}</div>}
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
                <div
                  className='text-center italic font-light'
                  dangerouslySetInnerHTML={{ __html: award.description }}
                />
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
            if (!award.gameId) {
              return (
                <div className="w-auto h-auto flex-shrink-0 bg-background rounded-xl shadow-sm text-center flex flex-col items-center p-4">
                  <p className="text-center italic font-light">The {award.title} award is still ongoing. Come back after December 12th !</p>
                </div>
              );
            }
            const game = getGameById(award.gameId);
            if (!game) {
              return (
                <div className="w-auto h-auto flex-shrink-0 bg-background rounded-xl shadow-sm text-center flex flex-col items-center p-4">
                  <p className="text-red-500 text-sm">Game not found</p>
                </div>
              );
            }
            const cover = coverMap ? coverMap[game.igdb_id] : []
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
