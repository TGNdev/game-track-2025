import { useEffect, useRef } from "react";
import { useGameUI } from "../../contexts/GameUIContext";
import { FiX } from "react-icons/fi";
import { motion } from "framer-motion";

const Modal = ({ title, children, onClose }) => {
  const {
    handleCloseModal,
    openButtonRef,
  } = useGameUI();

  const useOutsideClick = (callback, exceptions = []) => {
    const ref = useRef();

    useEffect(() => {
      const handleMouseDown = (event) => {
        const clickedInsideModal = ref.current && ref.current.contains(event.target);
        const clickedException = exceptions.some(
          exceptionRef => exceptionRef.current && exceptionRef.current.contains(event.target)
        );

        if (!clickedInsideModal && !clickedException) {
          callback();
        }
      };

      document.addEventListener('mousedown', handleMouseDown);
      return () => {
        document.removeEventListener('mousedown', handleMouseDown);
      };
    }, [callback, exceptions]);

    return ref;
  };

  const modalRef = useOutsideClick(onClose || handleCloseModal, [openButtonRef]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-sm bg-black/10"
        onClick={onClose || handleCloseModal}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        ref={modalRef}
        className="relative w-full max-w-2xl bg-black/20 border border-black/20 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col max-h-[90vh] scrollbar-hide"
      >
        <button
          onClick={onClose || handleCloseModal}
          className="absolute top-4 right-4 p-2 text-white/30 hover:text-white transition-colors hover:bg-white/10 rounded-full z-20"
        >
          <FiX size={20} />
        </button>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {title && (
            <h2 className="text-2xl font-black text-white leading-tight mb-6">
              {title}
            </h2>
          )}
          <div className="relative">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Modal;