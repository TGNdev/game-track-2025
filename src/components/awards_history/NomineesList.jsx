import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserAlt, FaMask } from 'react-icons/fa';

const NomineeCard = ({ nominee, game, cover, shouldShowOpacity, isWinner }) => {
  const [showCharacter, setShowCharacter] = useState(false);

  return (
    <div
      className={`w-72 h-auto flex-shrink-0 rounded-xl shadow-sm text-center flex flex-col items-center bg-white/5 border border-white/10 ${!isWinner ? 'border-primary' : ''} ${!isWinner && shouldShowOpacity ? 'opacity-40' : ''}`}
      id={isWinner ? 'winner' : ''}
    >
      {nominee.role ? (
        <>
          <div className="p-2">
            <div className="text-xl font-medium truncate w-full">
              {showCharacter ? nominee.role.as.name : nominee.role.actor.name}
            </div>
            <div className="text-lg truncate w-full italic text-white/60">
              <span className='text-sm non-italic text-white/40'>
                {showCharacter ? 'played by ' : 'as '}
              </span>
              {showCharacter ? nominee.role.actor.name : nominee.role.as.name}
            </div>
          </div>
          <div className="w-full h-72 overflow-hidden relative group">
            <AnimatePresence mode='wait'>
              <motion.img
                key={showCharacter ? 'char' : 'actor'}
                initial={{ opacity: 0, x: showCharacter ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: showCharacter ? -20 : 20 }}
                transition={{ duration: 0.3 }}
                src={showCharacter ? (nominee.role.as.image || nominee.role.actor.image) : nominee.role.actor.image}
                alt={showCharacter ? nominee.role.as.name : nominee.role.actor.name}
                referrerPolicy="no-referrer"
                className="object-cover h-full w-full absolute inset-0 rounded-t-lg"
              />
            </AnimatePresence>
            <button
              onClick={() => setShowCharacter(!showCharacter)}
              className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/20 hover:bg-white/20 transition-all shadow-lg text-white group-hover:scale-110 active:scale-95"
              title={showCharacter ? "Switch to Actor" : "Switch to Character"}
            >
              {showCharacter ? <FaUserAlt className="size-3" /> : <FaMask className="size-3" />}
            </button>
            {(!nominee.role.actor.image && !showCharacter) || (!nominee.role.as.image && showCharacter) ? (
              <div className="flex items-center justify-center h-full text-white/10 uppercase font-black tracking-widest text-xs">No Image</div>
            ) : null}
          </div>
          {game && <div className="text-sm my-3 italic px-2 truncate w-full">{game.name}</div>}
        </>
      ) : game ? (
        <>
          <div className="w-full h-96 overflow-hidden relative rounded-t-lg">
            {cover && cover.length > 0 ? (
              <img
                src={cover}
                alt={game.name}
                className="object-cover h-full w-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white/10 uppercase font-black tracking-widest text-xs">No Cover</div>
            )}
          </div>
          <div className="flex-1 flex items-center justify-center px-1 py-2">
            <div className="text-lg font-medium text-center line-clamp-2">{game.name}</div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-red-500 text-sm font-bold uppercase tracking-widest">Game not found</p>
        </div>
      )}
    </div>
  );
};

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
              <NomineeCard
                key={idx}
                nominee={nominee}
                game={game}
                cover={cover}
                shouldShowOpacity={shouldShowOpacity}
                isWinner={nominee.isWinner}
              />
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
                  className="w-80 h-auto bg-white/5 border border-white/10 rounded-xl shadow-xl overflow-hidden text-center flex flex-col items-center"
                  id="winner"
                >
                  <div className="w-full h-[480px] bg-white/5 relative">
                    {award.image ? (
                      <img
                        src={award.image}
                        alt={award.name}
                        className="object-cover h-full w-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/5 uppercase font-black tracking-widest text-xs">No Image</div>
                    )}
                  </div>
                  <div className="text-xl font-bold p-4 bg-white/5 w-full">{award.name}</div>
                </div>
              </div>
            );
          })()
        ) : (
          (() => {
            if (!award.gameId) {
              return (
                <div className="w-80 h-40 flex items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-xl p-8 text-center">
                  <p className="italic font-light text-white/40">The {award.title} award is still ongoing. Come back after December 12th !</p>
                </div>
              );
            }
            const game = getGameById(award.gameId);
            if (!game) {
              return (
                <div className="w-80 h-40 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl p-8">
                  <p className="text-red-500 text-sm font-bold uppercase tracking-widest">Game not found</p>
                </div>
              );
            }
            const cover = coverMap ? coverMap[game.igdb_id] : []
            return (
              <div
                key={award.gameId}
                className="w-80 h-auto bg-white/5 border border-white/10 rounded-xl shadow-xl overflow-hidden text-center flex flex-col items-center"
                id="winner"
              >
                <div className="w-full h-[480px] bg-white/5 relative">
                  {cover && cover.length > 0 ? (
                    <img
                      src={cover}
                      alt={game.name}
                      className="object-cover h-full w-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/5 uppercase font-black tracking-widest text-xs">No Cover</div>
                  )}
                </div>
                <div className="text-xl font-bold p-4 bg-white/5 w-full">{game.name}</div>
              </div>
            );
          })()
        )}
      </div>
    </motion.div>
  );
};

export default NomineeList;
