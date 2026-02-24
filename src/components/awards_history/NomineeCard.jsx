import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NomineeCard = ({ nominee, game, cover, shouldShowOpacity, isWinner, showCharacterOverride }) => {
  const [imageLoading, setImageLoading] = useState(true);

  const isRoleBased = !!nominee.role;
  const imageUrl = isRoleBased
    ? (showCharacterOverride ? (nominee.role.as.image || nominee.role.actor.image) : nominee.role.actor.image)
    : cover;

  useEffect(() => {
    setImageLoading(true);
  }, [imageUrl]);

  return (
    <div
      className={`
        relative w-72 h-auto flex-shrink-0 rounded-3xl overflow-hidden flex flex-col
        ${isWinner
          ? 'border-2 border-[#ff9e43]/60 shadow-[0_0_100px_rgba(255,158,67,0.75)]'
          : 'border border-white/20 shadow-2xl'
        }
        ${!isWinner && shouldShowOpacity ? 'opacity-60 grayscale-[0.5]' : 'opacity-100'}
      `}
    >
      {isRoleBased ? (
        <>
          <div className="p-6 relative z-10">
            <h4 className="text-xl font-black truncate w-full tracking-tight text-white drop-shadow-md">
              {nominee.role.actor.name}
            </h4>
            <div className="text-xs truncate w-full font-bold uppercase tracking-widest text-white/50 mt-1.5">
              as <span className="text-white/80">{nominee.role.as.name}</span>
            </div>
          </div>
          <div className="w-full h-80 overflow-hidden relative flex items-center justify-center">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <img src="/loading.gif" alt="Loading..." className="size-24 opacity-60" />
              </div>
            )}

            <AnimatePresence mode='wait'>
              <motion.img
                key={showCharacterOverride ? 'char' : 'actor'}
                initial={{ opacity: 0 }}
                animate={{ opacity: imageLoading ? 0 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                src={imageUrl}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                alt={showCharacterOverride ? nominee.role.as.name : nominee.role.actor.name}
                referrerPolicy="no-referrer"
                className="object-cover h-full w-full absolute inset-0 transition-transform duration-1000"
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-50" />

            {((!nominee.role.actor.image && !showCharacterOverride) || (!nominee.role.as.image && showCharacterOverride)) && !imageLoading && (
              <div className="flex items-center justify-center h-full w-full text-white/10 uppercase font-black tracking-[0.2em] text-[10px] italic">
                No Image Available
              </div>
            )}
          </div>
          <div className="p-5 flex items-center justify-center h-20">
            {game && (
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 truncate w-full text-center">
                {game.name}
              </div>
            )}
          </div>
        </>
      ) : game ? (
        <>
          <div className="w-full h-96 overflow-hidden relative flex items-center justify-center">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/10 backdrop-blur-md">
                <img src="/loading.gif" alt="Loading..." className="w-10 h-10 opacity-60" />
              </div>
            )}
            {cover && cover.length > 0 ? (
              <img
                src={cover}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                alt={game.name}
                className={`object-cover h-full w-full transition-all duration-700 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-white/5 text-white/10 uppercase font-black tracking-[0.2em] text-[10px] italic">
                No Cover Available
              </div>
            )}
          </div>
          <div className="p-6 flex items-center justify-center h-20">
            <div className="text-sm font-black uppercase tracking-[0.1em] text-center line-clamp-2 leading-relaxed text-white/90">
              {game.name}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-12 bg-white/10 backdrop-blur-xl">
          <p className="text-red-500/80 text-[10px] font-black uppercase tracking-widest border border-red-500/30 px-4 py-2 rounded-full bg-red-500/10">
            Game not found
          </p>
        </div>
      )}
    </div>
  );
};

export default NomineeCard;
