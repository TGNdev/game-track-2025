import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheck, FiFastForward, FiTrash2, FiClock } from "react-icons/fi";
import { FaTrophy } from "react-icons/fa";

const CompletionModal = ({ isOpen, onClose, onConfirm, mode = 'transition', initialStatus = null, initialHours = "" }) => {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState(initialStatus);
  const [hours, setHours] = useState(initialHours);

  document.body.style.overflow = isOpen ? 'hidden' : 'auto';

  const handleChoice = (selectedStatus) => {
    if (selectedStatus === 'remove') {
      onConfirm('remove');
      handleClose();
    } else {
      setStatus(selectedStatus);
      setStep(2);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(status, hours);
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setStatus(null);
    setHours(initialHours);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setHours(initialHours);
      setStatus(initialStatus);
      if (initialStatus === 'completed') {
        setStep(2);
      } else {
        setStep(1);
      }
    }
  }, [isOpen, initialHours, initialStatus]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 backdrop-blur-sm bg-black/20"
          onClick={handleClose}
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl overflow-hidden"
        >
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-2 text-white/30 hover:text-white transition-colors hover:bg-white/10 rounded-full"
          >
            <FiX size={24} />
          </button>

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white leading-tight w-fit">
                      Update your playtime
                    </h2>
                  </div>

                  <div className="flex flex-col gap-3">
                    {initialStatus === 'completed' ? (
                      <button
                        onClick={() => handleChoice('completed')}
                        className="w-full p-4 rounded-xl font-bold flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <FaTrophy size={20} />
                          <span>Update completion time</span>
                        </div>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleChoice('completed')}
                          className="w-full p-4 rounded-xl bg-gradient-primary text-white font-bold flex items-center justify-between group hover:scale-[1.02] transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <FiCheck size={20} />
                            <span>I finished the game !</span>
                          </div>
                          <span className="text-white/40 text-xs font-black uppercase tracking-widest group-hover:text-white/60 transition-colors">Completed</span>
                        </button>

                        <button
                          onClick={() => handleChoice('played')}
                          className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-between group hover:bg-white/10 hover:scale-[1.02] transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <FiFastForward size={20} className="text-primary-light" />
                            <span>{initialHours ? "I played more" : "I played but didn't finish"}</span>
                          </div>
                          <span className="text-white/40 text-xs font-black uppercase tracking-widest group-hover:text-white/60 transition-colors">Played</span>
                        </button>
                      </>
                    )}

                    {mode === 'transition' && (
                      <button
                        onClick={() => handleChoice('remove')}
                        className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold flex items-center justify-between group hover:bg-red-500/20 transition-all mt-4"
                      >
                        <div className="flex items-center gap-3">
                          <FiTrash2 size={20} />
                          <span>Never mind, just remove it</span>
                        </div>
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white leading-tight">
                      {status === 'completed' ? 'Congratulations !' : "You'll get there soon !"}
                    </h2>
                    <p className="text-white/60">
                      How many hours did you spend in this world ?
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                        <FiClock size={24} />
                      </div>
                      <input
                        type="number"
                        autoFocus
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        placeholder="0"
                        className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-5 pl-14 pr-20 text-3xl text-white font-black focus:outline-none focus:border-primary/50 transition-all"
                        min="0"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 font-black uppercase tracking-widest text-xs">
                        Hours
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 rounded-xl bg-gradient-primary text-white font-black uppercase tracking-widest shadow-xl text-sm"
                    >
                      Save Progress
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CompletionModal;
