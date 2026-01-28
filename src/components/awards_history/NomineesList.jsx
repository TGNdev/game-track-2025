import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserAlt, FaMask, FaTrophy } from 'react-icons/fa';

const NomineeCard = ({ nominee, game, cover, shouldShowOpacity, isWinner }) => {
  const [showCharacter, setShowCharacter] = useState(false);

  return (
    <motion.div
      className={`w-72 h-auto flex-shrink-0 rounded-2xl overflow-hidden relative flex flex-col border-2 ${isWinner ? 'border-[#ff9e43]/80 shadow-[0_0_50px_rgba(255,158,67,1)] -translate-y-1' : 'border-white/20 shadow-xl'} ${!isWinner && shouldShowOpacity ? 'opacity-40 grayscale-[0.5]' : ''}`}
    >
      {nominee.role ? (
        <>
          <div className="p-4 relative z-10 bg-gradient-to-b from-black/40 to-transparent">
            <div className="text-xl font-black truncate w-full tracking-tight">
              {nominee.role.actor.name}
            </div>
            <div className="text-xs truncate w-full font-bold uppercase tracking-widest text-white/40 mt-1">
              <span className="text-white/60">{nominee.role.as.name}</span>
            </div>
          </div>
          <div className="w-full h-80 overflow-hidden relative">
            <AnimatePresence mode='wait'>
              <motion.img
                key={showCharacter ? 'char' : 'actor'}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.4 }}
                src={showCharacter ? (nominee.role.as.image || nominee.role.actor.image) : nominee.role.actor.image}
                alt={showCharacter ? nominee.role.as.name : nominee.role.actor.name}
                referrerPolicy="no-referrer"
                className="object-cover h-full w-full absolute inset-0"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0" />
            <button
              onClick={() => setShowCharacter(!showCharacter)}
              className="absolute bottom-4 right-4 z-20 bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-white/20 hover:bg-white/20 transition-all shadow-lg text-white group-hover:scale-110 active:scale-95"
              title={showCharacter ? "Switch to Actor" : "Switch to Character"}
            >
              {showCharacter ? <FaUserAlt className="size-4" /> : <FaMask className="size-4" />}
            </button>
            {(!nominee.role.actor.image && !showCharacter) || (!nominee.role.as.image && showCharacter) ? (
              <div className="flex items-center justify-center h-full bg-white/5 text-white/10 uppercase font-black tracking-widest text-xs italic">No Image Available</div>
            ) : null}
          </div>
          <div className="p-4 bg-white/5 border-t border-white/5">
            {game && <div className="text-xs font-black uppercase tracking-widest text-primary-light truncate w-full">{game.name}</div>}
          </div>
        </>
      ) : game ? (
        <>
          <div className="w-full h-96 overflow-hidden relative">
            {cover && cover.length > 0 ? (
              <img
                src={cover}
                alt={game.name}
                className="object-cover h-full w-full transition-transform duration-700"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-white/5 text-white/10 uppercase font-black tracking-widest text-xs italic">No Cover Available</div>
            )}
          </div>
          <div className="p-4 flex items-center justify-center min-h-[4rem]">
            <div className="text-sm font-black uppercase tracking-widest text-center line-clamp-2 leading-relaxed">{game.name}</div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-12">
          <p className="text-red-500/60 text-[10px] font-black uppercase tracking-widest border border-red-500/20 px-3 py-1 rounded-full">Game not found</p>
        </div>
      )}
    </motion.div>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="px-4 py-8"
    >
      <div className="flex flex-col items-center mb-10">
        <h3 className="text-4xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent text-center">
          {award.title}
        </h3>
        <div className="h-1 w-20 bg-gradient-tertiary mt-4 rounded-full shadow-[0_0_10px_rgba(255,158,67,0.5)]" />
      </div>

      {!shouldShowOpacity && (
        <div className='w-full flex flex-row justify-center mb-10'>
          <div className='max-w-xl text-center bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl'>
            <p className='text-lg font-medium text-white/80 italic'>
              Stay tuned! Winners will be announced at The Game Awards ceremony in <span className="text-primary-light font-black not-italic">December </span>!
            </p>
          </div>
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
                <motion.div
                  key={award.name}
                  className="w-80 h-auto border-2 border-[#ff9e43]/80 shadow-[0_0_50px_rgba(255,158,67,1)] -translate-y-1 rounded-2xl overflow-hidden text-center flex flex-col items-center relative"
                >
                  <div className="w-full h-[480px] relative">
                    {award.image ? (
                      <img
                        src={award.image}
                        alt={award.name}
                        className="object-cover h-full w-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/5 uppercase font-black tracking-widest text-xs italic">No Image Available</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0" />
                  </div>
                  <div className="p-6 bg-white/5 border-t border-white/5 w-full">
                    <div className="text-lg font-black uppercase tracking-widest leading-relaxed">{award.name}</div>
                  </div>
                </motion.div>
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
              <motion.div
                whileHover={{ scale: 1.05 }}
                key={award.gameId}
                className="w-80 h-auto bg-white/5 backdrop-blur-xl border border-[#ff9e43]/50 rounded-2xl shadow-[0_0_30px_rgba(255,158,67,0.2)] overflow-hidden text-center flex flex-col items-center relative"
              >
                <div className="absolute top-4 left-4 z-30">
                  <div className="bg-gradient-tertiary px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/20 shadow-2xl">
                    <FaTrophy className="text-white size-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Winner</span>
                  </div>
                </div>
                <div className="w-full h-[480px] bg-white/5 relative group">
                  {cover && cover.length > 0 ? (
                    <img
                      src={cover}
                      alt={game.name}
                      className="object-cover h-full w-full transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/5 uppercase font-black tracking-widest text-xs italic">No Cover Available</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-6 bg-white/5 border-t border-white/5 w-full">
                  <div className="text-lg font-black uppercase tracking-widest leading-relaxed">{game.name}</div>
                </div>
              </motion.div>
            );
          })()
        )}
      </div>
    </motion.div>
  );
};

export default NomineeList;
