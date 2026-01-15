import { useEffect, useRef } from "react";
import { useGameUI } from "../../contexts/GameUIContext";
import { FaPlus } from "react-icons/fa";

const Modal = ({ title, children, onClose }) => {
  const {
    handleCloseModal,
    openButtonRef,
  } = useGameUI();

  const useOutsideClick = (callback, exceptions = []) => {
    const ref = useRef();

    useEffect(() => {
      const handleClick = (event) => {
        const clickedInsideModal = ref.current && ref.current.contains(event.target);
        const clickedException = exceptions.some(
          exceptionRef => exceptionRef.current && exceptionRef.current.contains(event.target)
        );

        if (!clickedInsideModal && !clickedException) {
          callback();
        }
      };

      document.addEventListener('click', handleClick);
      return () => {
        document.removeEventListener('click', handleClick);
      };
    }, [callback, exceptions]);

    return ref;
  };

  const modalRef = useOutsideClick(onClose || handleCloseModal, [openButtonRef]);

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div
        ref={modalRef}
        className="bg-background border-primary rounded-lg w-full max-w-2xl relative max-h-[75%] overflow-auto transition shadow-2xl"
      >
        <button
          onClick={onClose || handleCloseModal}
          className="absolute top-4 right-4 text-lg rotate-45 hover:scale-105 transition"
        >
          <FaPlus />
        </button>
        <div className="px-8 py-5">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;