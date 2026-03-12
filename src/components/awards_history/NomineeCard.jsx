import SmartCover from '../shared/SmartCover';

const NomineeCard = ({ nominee, game, cover, shouldShowOpacity, isWinner, showCharacterOverride }) => {
  const isRoleBased = !!nominee.role;
  const imageUrl = isRoleBased
    ? (showCharacterOverride ? (nominee.role.as.image || nominee.role.actor.image) : nominee.role.actor.image)
    : cover;

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
          <SmartCover
            src={imageUrl}
            alt={showCharacterOverride ? nominee.role.as.name : nominee.role.actor.name}
            className="w-full h-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-50" />
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
          <SmartCover
            src={cover}
            alt={game.name}
            className="w-full h-96 bg-white/10 backdrop-blur-md"
          />
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
