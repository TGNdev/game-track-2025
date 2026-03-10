import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUserAlt, FaMask } from 'react-icons/fa';
import NomineeCard from './NomineeCard';

const NomineeList = ({ award, getGameById, coverMap, awardYear }) => {
  const [globalShowCharacter, setGlobalShowCharacter] = useState(false);
  const currentYear = new Date().getFullYear();
  const isCurrentYear = awardYear === currentYear;
  const allNomineesAreLosers = award.nominees && award.nominees.length > 0 &&
    award.nominees.every(nominee => !nominee.isWinner);
  const shouldShowOpacity = !(isCurrentYear && allNomineesAreLosers);

  const hasRoleBasedNominees = award.nominees?.some(n => n.role);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="px-4 py-8"
    >
      <div className="flex flex-col items-center mb-10 relative">
        <h3 className="text-4xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent text-center">
          {award.title}
        </h3>
        <div className="h-1 w-20 bg-gradient-tertiary mt-4 rounded-full shadow-[0_0_10px_rgba(255,158,67,0.5)]" />

        {hasRoleBasedNominees && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setGlobalShowCharacter(!globalShowCharacter)}
            className="mt-8 flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-6 py-2.5 rounded-2xl transition-all shadow-xl text-white font-bold text-sm uppercase tracking-widest active:scale-95 group"
          >
            <div className="relative w-5 h-5">
              <motion.div
                animate={{ rotateY: globalShowCharacter ? 180 : 0, opacity: globalShowCharacter ? 0 : 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <FaUserAlt className="size-4" />
              </motion.div>
              <motion.div
                initial={{ rotateY: -180, opacity: 0 }}
                animate={{ rotateY: globalShowCharacter ? 0 : -180, opacity: globalShowCharacter ? 1 : 0 }}
                className="absolute inset-0 flex items-center justify-center text-white"
              >
                <FaMask className="size-4" />
              </motion.div>
            </div>
            <span>{globalShowCharacter ? "Switch to Actors" : "Switch to Characters"}</span>
          </motion.button>
        )}
      </div>

      {!shouldShowOpacity && (
        <div className='w-full flex flex-row justify-center mb-10'>
          <div className='max-w-xl text-center bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl'>
            <p className='text-lg font-medium text-white/80 italic'>
              Stay tuned! Winners will be announced at The Game Awards ceremony in <span className="text-white font-black not-italic underline decoration-primary decoration-2 underline-offset-4">December </span>!
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-6 justify-center mt-8">
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
                showCharacterOverride={globalShowCharacter}
              />
            );
          })
        ) : award.description ? (
          <div className='flex flex-col gap-8 items-center justify-center'>
            <div
              className='text-center italic font-light max-w-2xl text-white/70 leading-relaxed'
              dangerouslySetInnerHTML={{ __html: award.description }}
            />
            <NomineeCard
              nominee={{}} // Not role based
              game={{ name: award.name }}
              cover={award.image}
              shouldShowOpacity={false}
              isWinner={true}
            />
          </div>
        ) : (
          (() => {
            if (!award.gameId) {
              return (
                <div className="w-80 h-40 flex items-center justify-center bg-white/5 backdrop-blur-sm border border-dashed border-white/10 rounded-2xl p-8 text-center">
                  <p className="italic font-light text-white/40">The {award.title} award is still ongoing. Come back after December 12th !</p>
                </div>
              );
            }
            const game = getGameById(award.gameId);
            if (!game) {
              return (
                <div className="w-80 h-40 flex items-center justify-center bg-white/5 border border-white/20 rounded-2xl p-8">
                  <p className="text-red-500/80 text-sm font-black uppercase tracking-widest">Game not found</p>
                </div>
              );
            }
            const cover = coverMap ? coverMap[game.igdb_id] : []
            return (
              <NomineeCard
                nominee={{}}
                game={game}
                cover={cover}
                shouldShowOpacity={false}
                isWinner={true}
              />
            );
          })()
        )}
      </div>
    </motion.div>
  );
};

export default NomineeList;
